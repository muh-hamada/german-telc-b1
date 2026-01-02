#!/usr/bin/env python3
import json
import sys

def find_duplicates(obj, prefix="", seen_keys=None):
    """Recursively find duplicate keys in a nested dict"""
    if seen_keys is None:
        seen_keys = {}
    
    duplicates = []
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            
            if full_key in seen_keys:
                duplicates.append((full_key, seen_keys[full_key], "current"))
            else:
                seen_keys[full_key] = "first"
            
            dups = find_duplicates(value, full_key, seen_keys)
            duplicates.extend(dups)
    
    return duplicates

def main():
    filepath = "app/GermanTelcB1App/src/locales/en.json"
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        duplicates = find_duplicates(data)
        
        if duplicates:
            print(f"Found {len(duplicates)} duplicate keys in {filepath}:")
            for key, _, _ in duplicates:
                print(f"  - {key}")
        else:
            print(f"No duplicate keys found in {filepath}")
            
    except FileNotFoundError:
        print(f"File not found: {filepath}")
    except json.JSONDecodeError as e:
        print(f"JSON decode error in {filepath}: {e}")

if __name__ == "__main__":
    main()

