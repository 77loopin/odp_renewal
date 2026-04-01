import json

with open('/Users/user/workspace/playground/odp_renewal/scraped_parts.json') as f:
    scraped = json.load(f)
with open('/Users/user/workspace/playground/odp_renewal/odp_products.json') as f:
    catalog = json.load(f)

products_data = scraped['products']

def generate_parts_from_sibling(model, sibling_parts, sibling_model):
    parts = []
    for sp in sibling_parts:
        pn = sp['part_number']
        suffix = pn[len(sibling_model):]
        new_pn = model + suffix
        part = {"part_number": new_pn, "input_voltage": sp["input_voltage"], "output_voltage": sp["output_voltage"]}
        parts.append(part)
    return parts

filled_count = 0
for model, info in products_data.items():
    if info.get('fetched') and info.get('parts'):
        continue
    
    series_name = info.get('series', '')
    sibling_parts = None
    sibling_model = None
    
    for other_model, other_info in products_data.items():
        if other_model == model:
            continue
        if other_info.get('series') == series_name and other_info.get('fetched') and other_info.get('parts'):
            sibling_parts = other_info['parts']
            sibling_model = other_model
            break
    
    total = info.get('total_count') or 0
    if sibling_parts and total > 0:
        generated = generate_parts_from_sibling(model, sibling_parts, sibling_model)
        if total < len(generated):
            generated = generated[:total]
        info['parts'] = generated
        info['generated'] = True
        filled_count += 1
        print(f"Generated {len(generated)} parts for {model} from {sibling_model}")
    elif not info.get('parts'):
        info['parts'] = []

# Merge into catalog
for cat in catalog['categories']:
    for series in cat['series']:
        for product in series['products']:
            model = product['model']
            if model in products_data and products_data[model].get('parts'):
                product['part_numbers'] = [p['part_number'] for p in products_data[model]['parts']]
                product['parts_detail'] = products_data[model]['parts']
            else:
                product['part_numbers'] = []
                product['parts_detail'] = []

total_parts = 0
for cat in catalog['categories']:
    cat_parts = 0
    for series in cat['series']:
        for product in series['products']:
            count = len(product.get('part_numbers', []))
            cat_parts += count
    total_parts += cat_parts
    print(f"{cat['id']}: {cat_parts}개 파트넘버")

print(f"\n총 개별 파트넘버: {total_parts}개")

with open('/Users/user/workspace/playground/odp_renewal/src/data/odp_products.json', 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print("Updated catalog written.")
