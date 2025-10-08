from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Payment as PaymentModel, Player as PlayerModel, PaymentStatus
import schemas
import razorpay
import hmac
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)

@router.post("/create-order")
async def create_razorpay_order(player_id: int, db: Session = Depends(get_db)):
    """Create a Razorpay order for player registration with UPI support"""
    player = db.query(PlayerModel).filter(PlayerModel.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if player.registration_fee_paid:
        raise HTTPException(status_code=400, detail="Registration fee already paid")
    
    try:
        # Create or get existing payment record
        payment = db.query(PaymentModel).filter(PaymentModel.player_id == player_id).first()
        if not payment:
            payment = PaymentModel(player_id=player_id, amount=500.0)
            db.add(payment)
            db.commit()
            db.refresh(payment)
        
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": 50000,  # 500 INR in paise
            "currency": "INR",
            "receipt": f"gpl_reg_{player_id}_{payment.id}",
            "notes": {
                "player_id": str(player_id),
                "player_name": player.name,
                "payment_id": str(payment.id),
                "description": "GPL Season 2 Registration Fee"
            }
        })
        
        # Update payment with Razorpay order ID
        payment.razorpay_order_id = razorpay_order['id']
        payment.status = PaymentStatus.PENDING
        db.commit()
        
        return {
            "order_id": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "payment_id": payment.id,
            "player_name": player.name,
            "player_email": player.email,
            "key_id": os.getenv("RAZORPAY_KEY_ID")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify")
async def verify_payment(
    payment_data: dict,
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment signature and update payment status"""
    try:
        razorpay_order_id = payment_data.get('razorpay_order_id')
        razorpay_payment_id = payment_data.get('razorpay_payment_id')
        razorpay_signature = payment_data.get('razorpay_signature')
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            raise HTTPException(status_code=400, detail="Missing payment details")
        
        # Verify signature
        generated_signature = hmac.new(
            os.getenv("RAZORPAY_KEY_SECRET").encode(),
            f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get payment record
        payment = db.query(PaymentModel).filter(
            PaymentModel.razorpay_order_id == razorpay_order_id
        ).first()
        
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found")
        
        # Fetch payment details from Razorpay to get UPI details
        razorpay_payment_details = razorpay_client.payment.fetch(razorpay_payment_id)
        
        # Update payment record
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.status = PaymentStatus.COMPLETED
        payment.payment_method = razorpay_payment_details.get('method', 'unknown')
        
        # Extract UPI transaction ID if payment was via UPI
        if razorpay_payment_details.get('method') == 'upi':
            upi_data = razorpay_payment_details.get('acquirer_data', {})
            payment.upi_transaction_id = upi_data.get('rrn') or upi_data.get('upi_transaction_id')
        
        # Update player status
        player = db.query(PlayerModel).filter(PlayerModel.id == payment.player_id).first()
        if player:
            player.registration_fee_paid = True
            player.payment_id = razorpay_payment_id
            player.status = PlayerModel.PlayerStatus if hasattr(PlayerModel, 'PlayerStatus') else "registered"
        
        db.commit()
        db.refresh(payment)
        
        return {
            "success": True,
            "message": "Payment verified successfully",
            "payment_id": payment.id,
            "player_id": payment.player_id,
            "payment_method": payment.payment_method,
            "upi_transaction_id": payment.upi_transaction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@router.get("/status/{order_id}")
async def get_payment_status(order_id: str, db: Session = Depends(get_db)):
    """Get payment status by Razorpay order ID"""
    payment = db.query(PaymentModel).filter(
        PaymentModel.razorpay_order_id == order_id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "payment_id": payment.id,
        "player_id": payment.player_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "payment_method": payment.payment_method,
        "razorpay_order_id": payment.razorpay_order_id,
        "razorpay_payment_id": payment.razorpay_payment_id,
        "upi_transaction_id": payment.upi_transaction_id,
        "created_at": payment.created_at,
        "updated_at": payment.updated_at
    }

@router.get("/{player_id}/player-status", response_model=schemas.Payment)
async def get_payment_by_player(player_id: int, db: Session = Depends(get_db)):
    """Get payment status for a player"""
    payment = db.query(PaymentModel).filter(PaymentModel.player_id == player_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Razorpay webhook events"""
    payload = await request.body()
    signature = request.headers.get('X-Razorpay-Signature')
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    
    if not webhook_secret:
        # If webhook secret is not configured, skip verification (not recommended for production)
        pass
    else:
        # Verify webhook signature
        try:
            razorpay_client.utility.verify_webhook_signature(
                payload.decode(),
                signature,
                webhook_secret
            )
        except:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    
    # Parse webhook data
    import json
    webhook_data = json.loads(payload)
    
    event = webhook_data.get('event')
    
    # Handle payment.captured event
    if event == 'payment.captured':
        payment_entity = webhook_data.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = payment_entity.get('order_id')
        payment_id = payment_entity.get('id')
        
        if order_id:
            payment = db.query(PaymentModel).filter(
                PaymentModel.razorpay_order_id == order_id
            ).first()
            
            if payment and payment.status != PaymentStatus.COMPLETED:
                payment.razorpay_payment_id = payment_id
                payment.status = PaymentStatus.COMPLETED
                payment.payment_method = payment_entity.get('method')
                
                # Update player
                player = db.query(PlayerModel).filter(PlayerModel.id == payment.player_id).first()
                if player:
                    player.registration_fee_paid = True
                    player.payment_id = payment_id
                
                db.commit()
    
    # Handle payment.failed event
    elif event == 'payment.failed':
        payment_entity = webhook_data.get('payload', {}).get('payment', {}).get('entity', {})
        order_id = payment_entity.get('order_id')
        
        if order_id:
            payment = db.query(PaymentModel).filter(
                PaymentModel.razorpay_order_id == order_id
            ).first()
            
            if payment:
                payment.status = PaymentStatus.FAILED
                db.commit()
    
    return {"status": "success"}
