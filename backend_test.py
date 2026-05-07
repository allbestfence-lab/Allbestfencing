#!/usr/bin/env python3
"""
Comprehensive backend test suite for All Best Fencing admin photo manager.
Tests all admin authentication, photo upload, management, and public endpoints.
"""

import requests
import io
import os
from PIL import Image
from pathlib import Path

# Read backend URL from frontend .env
BACKEND_URL = "https://form-debug-9.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
ADMIN_PASSWORD = "Password@12"

# Test state
admin_token = None
uploaded_photo_ids = []

def print_test(name):
    """Print test section header"""
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_result(passed, message):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")
    return passed

def create_test_image(width, height, color=(100, 150, 200)):
    """Create a test image in memory"""
    img = Image.new('RGB', (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=95)
    buf.seek(0)
    return buf

def create_test_png(width, height, color=(200, 100, 150)):
    """Create a test PNG image in memory"""
    img = Image.new('RGB', (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf

# ============ Test 1: Admin Login ============
def test_admin_login():
    global admin_token
    print_test("1. POST /api/admin/login")
    
    # Test 1a: Wrong password
    print("\n1a. Testing wrong password...")
    resp = requests.post(f"{API_BASE}/admin/login", json={"password": "WrongPassword123"})
    if print_result(
        resp.status_code == 401 and "Incorrect password" in resp.text,
        f"Wrong password returns 401 with 'Incorrect password' (status={resp.status_code}, body={resp.text[:200]})"
    ):
        pass
    else:
        print(f"   Expected: 401 with 'Incorrect password'")
        print(f"   Got: {resp.status_code} - {resp.text}")
    
    # Test 1b: Correct password
    print("\n1b. Testing correct password...")
    resp = requests.post(f"{API_BASE}/admin/login", json={"password": ADMIN_PASSWORD})
    if resp.status_code == 200:
        data = resp.json()
        if "access_token" in data and data.get("token_type") == "bearer":
            admin_token = data["access_token"]
            print_result(True, f"Correct password returns 200 with access_token and token_type='bearer'")
            print(f"   Token: {admin_token[:50]}...")
        else:
            print_result(False, f"Response missing access_token or token_type. Got: {data}")
    else:
        print_result(False, f"Expected 200, got {resp.status_code}: {resp.text}")

# ============ Test 2: Admin Me Endpoint ============
def test_admin_me():
    print_test("2. GET /api/admin/me")
    
    # Test 2a: No token
    print("\n2a. Testing without token...")
    resp = requests.get(f"{API_BASE}/admin/me")
    print_result(
        resp.status_code == 401,
        f"No token returns 401 (status={resp.status_code})"
    )
    
    # Test 2b: With Bearer token
    print("\n2b. Testing with Bearer token...")
    if not admin_token:
        print_result(False, "No admin token available (login test may have failed)")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.get(f"{API_BASE}/admin/me", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print_result(
            data.get("ok") is True and data.get("role") == "admin",
            f"With token returns 200 with ok=true, role='admin': {data}"
        )
    else:
        print_result(False, f"Expected 200, got {resp.status_code}: {resp.text}")

# ============ Test 3: Photo Upload ============
def test_photo_upload():
    global uploaded_photo_ids
    print_test("3. POST /api/admin/photos/upload")
    
    if not admin_token:
        print_result(False, "No admin token available - skipping upload test")
        return
    
    print("\n3a. Uploading 2 sample images (3000x2000 jpg + 1500x1000 png)...")
    
    # Create test images
    img1 = create_test_image(3000, 2000, color=(120, 180, 220))
    img2 = create_test_png(1500, 1000, color=(220, 120, 180))
    
    files = [
        ('files', ('test_large.jpg', img1, 'image/jpeg')),
        ('files', ('test_medium.png', img2, 'image/png'))
    ]
    
    data = {
        'category': 'Wood Fence',
        'caption': 'Cedar fence — Burnaby',
        'featured': 'true',
        'show_on_homepage': 'true',
        'service_hero_for': 'wood'
    }
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.post(f"{API_BASE}/admin/photos/upload", files=files, data=data, headers=headers)
    
    if resp.status_code == 200:
        result = resp.json()
        print_result(
            result.get("count") == 2,
            f"Upload returns count=2: {result.get('count')}"
        )
        
        photos = result.get("photos", [])
        if len(photos) == 2:
            print("   Uploaded photos:")
            for p in photos:
                uploaded_photo_ids.append(p.get("id"))
                url = p.get("url", "")
                width = p.get("width")
                print(f"     - ID: {p.get('id')}")
                print(f"       URL: {url}")
                print(f"       Size: {width}x{p.get('height')} ({p.get('size_bytes')} bytes)")
                print(f"       Category: {p.get('category')}, Featured: {p.get('featured')}")
                
                # Verify URL format
                if url.startswith("/api/uploads/portfolio/") and url.endswith(".jpg"):
                    print_result(True, f"URL format correct: {url}")
                else:
                    print_result(False, f"URL format incorrect: {url}")
                
                # Verify resizing (should be ≤1920 for oversized image)
                if width and width <= 1920:
                    print_result(True, f"Image resized correctly: width={width} ≤ 1920")
                else:
                    print_result(False, f"Image not resized: width={width}")
            
            # Test 3b: Verify public access to uploaded image
            print("\n3b. Testing public access to uploaded image...")
            first_photo_url = photos[0].get("url", "")
            if first_photo_url:
                public_url = f"{BACKEND_URL}{first_photo_url}"
                resp = requests.get(public_url)
                if resp.status_code == 200 and 'image' in resp.headers.get('content-type', '').lower():
                    print_result(True, f"Public image access works: {public_url} (content-type: {resp.headers.get('content-type')})")
                else:
                    print_result(False, f"Public image access failed: {resp.status_code}, content-type: {resp.headers.get('content-type')}")
        else:
            print_result(False, f"Expected 2 photos in response, got {len(photos)}")
    else:
        print_result(False, f"Upload failed: {resp.status_code} - {resp.text}")

# ============ Test 4: Validation Errors ============
def test_validation_errors():
    print_test("4. Validation Errors")
    
    if not admin_token:
        print_result(False, "No admin token available - skipping validation tests")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 4a: Invalid category
    print("\n4a. Testing invalid category 'Bogus'...")
    img = create_test_image(800, 600)
    files = [('files', ('test.jpg', img, 'image/jpeg'))]
    data = {'category': 'Bogus'}
    resp = requests.post(f"{API_BASE}/admin/photos/upload", files=files, data=data, headers=headers)
    print_result(
        resp.status_code == 400 and "Invalid category" in resp.text,
        f"Invalid category returns 400 (status={resp.status_code}, message contains 'Invalid category')"
    )
    
    # Test 4b: Upload .txt file
    print("\n4b. Testing upload of .txt file...")
    txt_file = io.BytesIO(b"This is not an image")
    files = [('files', ('test.txt', txt_file, 'text/plain'))]
    data = {'category': 'Wood Fence'}
    resp = requests.post(f"{API_BASE}/admin/photos/upload", files=files, data=data, headers=headers)
    print_result(
        resp.status_code == 400 and "Unsupported file type" in resp.text,
        f"Unsupported file type returns 400 (status={resp.status_code}, message: {resp.text[:200]})"
    )

# ============ Test 5: Public Photos Endpoint ============
def test_public_photos():
    print_test("5. GET /api/photos (public)")
    
    # Test 5a: List all public photos
    print("\n5a. Testing public photo listing...")
    resp = requests.get(f"{API_BASE}/photos")
    if resp.status_code == 200:
        data = resp.json()
        photos = data.get("photos", [])
        print_result(True, f"Public photos endpoint returns 200 with {len(photos)} photos")
        
        # Verify only show_on_homepage=true photos
        all_homepage = all(p.get("show_on_homepage") is True for p in photos)
        print_result(all_homepage, f"All photos have show_on_homepage=true: {all_homepage}")
        
        # Check if featured photos appear first
        if len(photos) > 1:
            featured_indices = [i for i, p in enumerate(photos) if p.get("featured")]
            if featured_indices:
                first_featured = featured_indices[0]
                print_result(
                    first_featured == 0 or all(photos[i].get("featured") for i in range(first_featured + 1)),
                    f"Featured photos appear first"
                )
    else:
        print_result(False, f"Expected 200, got {resp.status_code}: {resp.text}")
    
    # Test 5b: Filter by category
    print("\n5b. Testing category filter (Wood Fence)...")
    resp = requests.get(f"{API_BASE}/photos", params={"category": "Wood Fence"})
    if resp.status_code == 200:
        data = resp.json()
        photos = data.get("photos", [])
        all_wood = all(p.get("category") == "Wood Fence" for p in photos)
        print_result(
            all_wood,
            f"Category filter works: all {len(photos)} photos are 'Wood Fence'"
        )
    else:
        print_result(False, f"Expected 200, got {resp.status_code}: {resp.text}")

# ============ Test 6: Update Photo ============
def test_update_photo():
    print_test("6. PATCH /api/admin/photos/{id}")
    
    if not admin_token or not uploaded_photo_ids:
        print_result(False, "No admin token or uploaded photos - skipping update test")
        return
    
    photo_id = uploaded_photo_ids[0]
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    print(f"\n6a. Updating photo {photo_id}...")
    update_data = {
        "caption": "Updated caption",
        "category": "Metal Fence",
        "show_on_homepage": False
    }
    
    resp = requests.patch(f"{API_BASE}/admin/photos/{photo_id}", json=update_data, headers=headers)
    if resp.status_code == 200:
        result = resp.json()
        photo = result.get("photo", {})
        print_result(
            photo.get("caption") == "Updated caption" and 
            photo.get("category") == "Metal Fence" and 
            photo.get("show_on_homepage") is False,
            f"Photo updated successfully: caption='{photo.get('caption')}', category='{photo.get('category')}', show_on_homepage={photo.get('show_on_homepage')}"
        )
        
        # Test 6b: Verify changes in admin list
        print("\n6b. Verifying changes in admin photo list...")
        resp = requests.get(f"{API_BASE}/admin/photos", headers=headers)
        if resp.status_code == 200:
            admin_photos = resp.json().get("photos", [])
            updated_photo = next((p for p in admin_photos if p.get("id") == photo_id), None)
            if updated_photo:
                print_result(
                    updated_photo.get("caption") == "Updated caption",
                    f"Admin list reflects update: caption='{updated_photo.get('caption')}'"
                )
            else:
                print_result(False, f"Photo {photo_id} not found in admin list")
        
        # Test 6c: Verify photo is gone from public list
        print("\n6c. Verifying photo removed from public list (show_on_homepage=false)...")
        resp = requests.get(f"{API_BASE}/photos")
        if resp.status_code == 200:
            public_photos = resp.json().get("photos", [])
            photo_in_public = any(p.get("id") == photo_id for p in public_photos)
            print_result(
                not photo_in_public,
                f"Photo correctly hidden from public list: {not photo_in_public}"
            )
        else:
            print_result(False, f"Failed to fetch public photos: {resp.status_code}")
    else:
        print_result(False, f"Update failed: {resp.status_code} - {resp.text}")

# ============ Test 7: Service Hero Exclusivity ============
def test_service_hero_exclusivity():
    print_test("7. service_hero_for exclusivity")
    
    if not admin_token:
        print_result(False, "No admin token available - skipping service hero test")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get current wood hero photo ID
    print("\n7a. Checking current 'wood' service hero...")
    resp = requests.get(f"{API_BASE}/services/hero-photos")
    if resp.status_code == 200:
        hero_map = resp.json().get("map", {})
        old_wood_hero_url = hero_map.get("wood", {}).get("url")
        print(f"   Current wood hero URL: {old_wood_hero_url}")
    
    # Upload a new photo with service_hero_for="wood"
    print("\n7b. Uploading new photo with service_hero_for='wood'...")
    img = create_test_image(1200, 800, color=(150, 200, 100))
    files = [('files', ('test_hero.jpg', img, 'image/jpeg'))]
    data = {
        'category': 'Wood Fence',
        'caption': 'New wood hero',
        'service_hero_for': 'wood'
    }
    
    resp = requests.post(f"{API_BASE}/admin/photos/upload", files=files, data=data, headers=headers)
    if resp.status_code == 200:
        result = resp.json()
        new_photo = result.get("photos", [{}])[0]
        new_photo_id = new_photo.get("id")
        uploaded_photo_ids.append(new_photo_id)
        print_result(True, f"New wood hero uploaded: {new_photo_id}")
        
        # Verify the new photo is the wood hero
        print("\n7c. Verifying new photo is the wood service hero...")
        resp = requests.get(f"{API_BASE}/services/hero-photos")
        if resp.status_code == 200:
            hero_map = resp.json().get("map", {})
            new_wood_hero_url = hero_map.get("wood", {}).get("url")
            print_result(
                new_wood_hero_url == new_photo.get("url"),
                f"New photo is wood hero: {new_wood_hero_url}"
            )
            
            # Verify old hero photo has service_hero_for=null
            print("\n7d. Verifying previous wood hero has service_hero_for=null...")
            resp = requests.get(f"{API_BASE}/admin/photos", headers=headers)
            if resp.status_code == 200:
                all_photos = resp.json().get("photos", [])
                wood_heroes = [p for p in all_photos if p.get("service_hero_for") == "wood"]
                print_result(
                    len(wood_heroes) == 1 and wood_heroes[0].get("id") == new_photo_id,
                    f"Only one wood hero exists (the new one): {len(wood_heroes)} wood hero(es) found"
                )
            else:
                print_result(False, f"Failed to fetch admin photos: {resp.status_code}")
        else:
            print_result(False, f"Failed to fetch hero photos: {resp.status_code}")
    else:
        print_result(False, f"Upload failed: {resp.status_code} - {resp.text}")

# ============ Test 8: Delete Photo ============
def test_delete_photo():
    print_test("8. DELETE /api/admin/photos/{id}")
    
    if not admin_token or not uploaded_photo_ids:
        print_result(False, "No admin token or uploaded photos - skipping delete test")
        return
    
    photo_id = uploaded_photo_ids[0]
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get photo details first
    print(f"\n8a. Getting photo details for {photo_id}...")
    resp = requests.get(f"{API_BASE}/admin/photos", headers=headers)
    if resp.status_code == 200:
        photos = resp.json().get("photos", [])
        photo = next((p for p in photos if p.get("id") == photo_id), None)
        if photo:
            filename = photo.get("filename")
            print(f"   Photo filename: {filename}")
            
            # Delete the photo
            print(f"\n8b. Deleting photo {photo_id}...")
            resp = requests.delete(f"{API_BASE}/admin/photos/{photo_id}", headers=headers)
            if resp.status_code == 200:
                print_result(True, f"Photo deleted successfully: {resp.json()}")
                
                # Verify photo not in admin list
                print("\n8c. Verifying photo removed from admin list...")
                resp = requests.get(f"{API_BASE}/admin/photos", headers=headers)
                if resp.status_code == 200:
                    photos = resp.json().get("photos", [])
                    photo_exists = any(p.get("id") == photo_id for p in photos)
                    print_result(not photo_exists, f"Photo removed from admin list: {not photo_exists}")
                
                # Verify file deleted from disk
                print("\n8d. Verifying file deleted from disk...")
                file_path = f"/app/backend/uploads/portfolio/{filename}"
                file_exists = Path(file_path).exists()
                print_result(not file_exists, f"File removed from disk: {not file_exists} (path: {file_path})")
            else:
                print_result(False, f"Delete failed: {resp.status_code} - {resp.text}")
        else:
            print_result(False, f"Photo {photo_id} not found in admin list")
    else:
        print_result(False, f"Failed to fetch admin photos: {resp.status_code}")

# ============ Test 9: Lead Form Regression ============
def test_lead_form():
    print_test("9. Lead form regression (POST /api/leads/submit)")
    
    print("\n9a. Submitting test lead...")
    lead_data = {
        "name": "Test Customer",
        "phone": "6045551234",
        "email": "test@example.com",
        "service": "Wood Fence",
        "city": "Vancouver",
        "project_details": "Need a fence quote"
    }
    
    resp = requests.post(f"{API_BASE}/leads/submit", json=lead_data)
    if resp.status_code == 200:
        result = resp.json()
        print_result(True, f"Lead submission successful: {result}")
        print("   Note: Check backend logs for 'Email sent' message (Resend integration)")
    else:
        print_result(False, f"Lead submission failed: {resp.status_code} - {resp.text}")

# ============ Cleanup ============
def cleanup():
    print_test("CLEANUP: Removing test photos")
    
    if not admin_token:
        print("No admin token - skipping cleanup")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get all photos
    resp = requests.get(f"{API_BASE}/admin/photos", headers=headers)
    if resp.status_code == 200:
        photos = resp.json().get("photos", [])
        print(f"\nFound {len(photos)} photos in database")
        
        # Delete all but one
        if len(photos) > 1:
            for photo in photos[1:]:
                photo_id = photo.get("id")
                resp = requests.delete(f"{API_BASE}/admin/photos/{photo_id}", headers=headers)
                if resp.status_code == 200:
                    print(f"   Deleted photo {photo_id}")
                else:
                    print(f"   Failed to delete photo {photo_id}: {resp.status_code}")
        
        print(f"\nCleanup complete. {min(1, len(photos))} photo(s) remaining.")
    else:
        print(f"Failed to fetch photos for cleanup: {resp.status_code}")

# ============ Main Test Runner ============
def main():
    print("\n" + "="*80)
    print("ALL BEST FENCING - BACKEND API TEST SUITE")
    print("="*80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    print("="*80)
    
    try:
        test_admin_login()
        test_admin_me()
        test_photo_upload()
        test_validation_errors()
        test_public_photos()
        test_update_photo()
        test_service_hero_exclusivity()
        test_delete_photo()
        test_lead_form()
        cleanup()
        
        print("\n" + "="*80)
        print("TEST SUITE COMPLETE")
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
