#!/usr/bin/env python3
import json
import sys

def get_all_keys(obj, prefix=""):
    """Recursively get all keys from a nested dict"""
    keys = set()
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            keys.add(full_key)
            keys.update(get_all_keys(value, full_key))
    return keys

def main():
    # Load reference file (fr.json)
    with open("app/GermanTelcB1App/src/locales/fr.json", "r", encoding="utf-8") as f:
        fr_data = json.load(f)
    
    # Load target files
    target_files = ["en.json", "de.json", "es.json", "ar.json"]
    
    fr_keys = get_all_keys(fr_data)
    
    for target_file in target_files:
        filepath = f"app/GermanTelcB1App/src/locales/{target_file}"
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                target_data = json.load(f)
            
            target_keys = get_all_keys(target_data)
            missing_keys = fr_keys - target_keys
            
            print(f"\n{'='*60}")
            print(f"Missing keys in {target_file}: {len(missing_keys)}")
            print(f"{'='*60}")
            
            if missing_keys:
                for key in sorted(missing_keys):
                    print(f"  - {key}")
        except FileNotFoundError:
            print(f"File not found: {filepath}")
        except json.JSONDecodeError as e:
            print(f"JSON decode error in {filepath}: {e}")

if __name__ == "__main__":
    main()



