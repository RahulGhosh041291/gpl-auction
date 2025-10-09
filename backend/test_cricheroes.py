#!/usr/bin/env python3
"""
Test script for CricHeroes data fetching
Run this to test if the CricHeroes integration works
"""

import asyncio
import sys
from routers.registration import fetch_cricheroes_data

async def test_fetch():
    """Test the fetch_cricheroes_data function"""
    print("=" * 60)
    print("Testing CricHeroes Data Fetching")
    print("=" * 60)
    
    # Test cases - you can replace these with actual CricHeroes profile IDs
    test_cases = [
        # Format 1: Full URL
        # "https://cricheroes.in/player-profile/123456/john-doe",
        
        # Format 2: Profile path (ID/name)
        # "123456/john-doe",
        
        # Format 3: Just ID (may not work without name)
        # "123456",
    ]
    
    if len(sys.argv) > 1:
        # Use command line argument if provided
        test_cases = [sys.argv[1]]
    
    if not test_cases:
        print("\n⚠️  No test cases provided!")
        print("\nUsage:")
        print("  python test_cricheroes.py <cricheroes_profile_url_or_id>")
        print("\nExamples:")
        print("  python test_cricheroes.py https://cricheroes.in/player-profile/123456/player-name")
        print("  python test_cricheroes.py 123456/player-name")
        print("\n📝 How to get your CricHeroes profile URL:")
        print("  1. Go to https://cricheroes.in/")
        print("  2. Login to your account")
        print("  3. Click on your profile")
        print("  4. Copy the URL from the address bar")
        print("  5. The URL format is: https://cricheroes.in/player-profile/[ID]/[name]")
        return
    
    for test_id in test_cases:
        print(f"\n📊 Testing with: {test_id}")
        print("-" * 60)
        
        try:
            result = await fetch_cricheroes_data(test_id)
            
            if result:
                print("\n✅ Successfully fetched data!")
                print("\n📈 Player Statistics:")
                print(f"  Matches Played:    {result.get('matches_played', 0)}")
                print(f"  Runs Scored:       {result.get('runs_scored', 0)}")
                print(f"  Wickets Taken:     {result.get('wickets_taken', 0)}")
                print(f"  Batting Average:   {result.get('batting_average', 0.0):.2f}")
                print(f"  Bowling Average:   {result.get('bowling_average', 0.0):.2f}")
                print(f"  Strike Rate:       {result.get('strike_rate', 0.0):.2f}")
                
                if result.get('batting_style'):
                    print(f"  Batting Style:     {result['batting_style']}")
                if result.get('bowling_style'):
                    print(f"  Bowling Style:     {result['bowling_style']}")
            else:
                print("\n❌ Failed to fetch data")
                print("   Possible reasons:")
                print("   - Invalid profile ID/URL")
                print("   - Profile is private")
                print("   - Network connectivity issues")
                print("   - CricHeroes website structure changed")
                
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_fetch())
