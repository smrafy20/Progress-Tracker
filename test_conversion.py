#!/usr/bin/env python3
"""
Test script to test win32com PPT conversion method
"""

import os
import sys
import shutil
from app import convert_ppt_to_images_win32com

def test_win32com_conversion():
    # Path to existing PPT file
    ppt_path = "uploads_ppt/L12.5_-_Software_Design_Pattern_-_Example.pptx"

    if not os.path.exists(ppt_path):
        print(f"PPT file not found: {ppt_path}")
        return

    # Create a test output folder
    test_output_folder = "test_ppt_images_win32"
    if os.path.exists(test_output_folder):
        shutil.rmtree(test_output_folder)
    os.makedirs(test_output_folder)

    filename_base = "L12.5_-_Software_Design_Pattern_-_Example_WIN32"

    try:
        print("Testing Win32COM PPT conversion method...")
        print(f"Converting: {ppt_path}")
        print(f"Output folder: {test_output_folder}")
        print(f"Filename base: {filename_base}")
        print("-" * 60)

        slide_count = convert_ppt_to_images_win32com(ppt_path, test_output_folder, filename_base)

        print(f"✅ Win32COM Conversion successful!")
        print(f"📊 Total slides converted: {slide_count}")

        # List generated images
        output_path = os.path.join(test_output_folder, filename_base)
        if os.path.exists(output_path):
            images = [f for f in os.listdir(output_path) if f.endswith('.png')]
            images.sort()
            print(f"🖼️  Generated images: {len(images)}")
            for img in images:
                img_path = os.path.join(output_path, img)
                size = os.path.getsize(img_path)
                print(f"   - {img} ({size:,} bytes)")

        print("\n🎉 Win32COM Test completed successfully!")
        print(f"📁 Check the results in: {output_path}")

        # Compare with old method
        old_path = "uploads_ppt_images/L12.5_-_Software_Design_Pattern_-_Example"
        if os.path.exists(old_path):
            old_images = [f for f in os.listdir(old_path) if f.endswith('.png')]
            print(f"\n📊 Comparison with old method:")
            print(f"   Old method: {len(old_images)} images")
            print(f"   New method: {len(images)} images")

            if old_images and images:
                old_size = os.path.getsize(os.path.join(old_path, old_images[0]))
                new_size = os.path.getsize(os.path.join(output_path, images[0]))
                print(f"   Old image size: {old_size:,} bytes")
                print(f"   New image size: {new_size:,} bytes")
                print(f"   Size improvement: {((new_size - old_size) / old_size * 100):+.1f}%")

    except Exception as e:
        print(f"❌ Win32COM Conversion failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_win32com_conversion()
