#!/usr/bin/env python3
"""
Script to re-convert existing PPT file using the new win32com method
"""

import os
import shutil
from app import convert_ppt_to_images

def reconvert_existing_ppt():
    # Path to existing PPT file
    ppt_path = "uploads_ppt/L12.5_-_Software_Design_Pattern_-_Example.pptx"
    
    if not os.path.exists(ppt_path):
        print(f"PPT file not found: {ppt_path}")
        return
    
    # Backup old images
    old_images_folder = "uploads_ppt_images/L12.5_-_Software_Design_Pattern_-_Example"
    backup_folder = "uploads_ppt_images_backup/L12.5_-_Software_Design_Pattern_-_Example"
    
    if os.path.exists(old_images_folder):
        print("Backing up old images...")
        os.makedirs("uploads_ppt_images_backup", exist_ok=True)
        if os.path.exists(backup_folder):
            shutil.rmtree(backup_folder)
        shutil.copytree(old_images_folder, backup_folder)
        print(f"Old images backed up to: {backup_folder}")
        
        # Remove old images
        shutil.rmtree(old_images_folder)
        print("Old images removed")
    
    # Re-convert using new method
    output_folder = "uploads_ppt_images"
    filename_base = "L12.5_-_Software_Design_Pattern_-_Example"
    
    try:
        print("\nRe-converting PPT using new Win32COM method...")
        print(f"Converting: {ppt_path}")
        print(f"Output folder: {output_folder}")
        print(f"Filename base: {filename_base}")
        print("-" * 60)
        
        slide_count = convert_ppt_to_images(ppt_path, output_folder, filename_base)
        
        print(f"✅ Re-conversion successful!")
        print(f"📊 Total slides converted: {slide_count}")
        
        # List generated images
        output_path = os.path.join(output_folder, filename_base)
        if os.path.exists(output_path):
            images = [f for f in os.listdir(output_path) if f.endswith('.png')]
            images.sort()
            print(f"🖼️  Generated images: {len(images)}")
            for img in images:
                img_path = os.path.join(output_path, img)
                size = os.path.getsize(img_path)
                print(f"   - {img} ({size:,} bytes)")
        
        print("\n🎉 Re-conversion completed successfully!")
        print(f"📁 New high-quality images are in: {output_path}")
        print(f"📁 Old images backed up to: {backup_folder}")
        
        # Compare with backup
        if os.path.exists(backup_folder):
            backup_images = [f for f in os.listdir(backup_folder) if f.endswith('.png')]
            print(f"\n📊 Comparison:")
            print(f"   Old method: {len(backup_images)} images")
            print(f"   New method: {len(images)} images")
            
            if backup_images and images:
                old_size = os.path.getsize(os.path.join(backup_folder, backup_images[0]))
                new_size = os.path.getsize(os.path.join(output_path, images[0]))
                print(f"   Old image size: {old_size:,} bytes")
                print(f"   New image size: {new_size:,} bytes")
                print(f"   Quality improvement: {((new_size - old_size) / old_size * 100):+.1f}%")
        
    except Exception as e:
        print(f"❌ Re-conversion failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Restore backup if conversion failed
        if os.path.exists(backup_folder):
            print("Restoring backup images...")
            shutil.copytree(backup_folder, old_images_folder)
            print("Backup restored")

if __name__ == "__main__":
    reconvert_existing_ppt()
