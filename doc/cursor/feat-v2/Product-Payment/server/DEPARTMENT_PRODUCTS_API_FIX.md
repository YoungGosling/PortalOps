# Department Products API Bug Fix

## Date
October 23, 2025

## Issue Summary
The Department Master File feature was experiencing a critical bug where:
1. Clicking the dropdown to display department-assigned products resulted in a "Failed to load department products" error
2. After assigning products to a department and submitting successfully, reopening the Edit panel showed no selected products

## Root Cause
The `/api/departments/{department_id}/products` endpoint was returning raw SQLAlchemy ORM `Product` objects directly. These objects contained:
- A `status` field that was a SQLAlchemy relationship returning a `ProductStatus` **object** instead of a string
- Missing `service_name` field that needs to be populated from the related `Service` object

The Pydantic `Product` schema expected:
- `status` to be a string (the status name)
- `service_name` to be included in the response

This caused a Pydantic validation error:
```
fastapi.exceptions.ResponseValidationError: 1 validation errors:
  {'type': 'string_type', 'loc': ('response', 0, 'status'), 'msg': 'Input should be a valid string', 
   'input': <app.models.payment.ProductStatus object at 0x...>}
```

## Solution

### 1. Updated Endpoint Handler
**File:** `server/app/api/api_v1/endpoints/departments.py`

Modified the `get_department_products` endpoint (lines 137-205) to:
- Manually construct product dictionaries instead of returning raw ORM objects
- Query the `ProductStatus` table to get the status name string
- Query the latest payment information for each product
- Include `service_name` from the related service
- Format dates consistently as "MM/DD/YYYY"

The implementation now matches the pattern used in `/api/products` endpoint for consistency.

### 2. Updated CRUD Method
**File:** `server/app/crud/department.py`

Modified `get_department_products` method (lines 15-28) to:
- Use `joinedload(Product.service)` to eagerly load the service relationship
- This prevents N+1 query issues and ensures `product.service` is available

## Technical Details

### Before (Broken)
```python
@router.get("/{department_id}/products", response_model=List[Product])
def get_department_products(...):
    products = department.get_department_products(db, department_id=department_id)
    return products  # Returns raw ORM objects with status as object
```

### After (Fixed)
```python
@router.get("/{department_id}/products", response_model=List[Product])
def get_department_products(...):
    products = department.get_department_products(db, department_id=department_id)
    
    result = []
    for product in products:
        # Convert status object to string
        status_name = None
        if product.status_id:
            status_obj = db.query(ProductStatus).filter(
                ProductStatus.id == product.status_id).first()
            if status_obj:
                status_name = status_obj.name

        # Get payment info
        latest_payment = payment_info.get_latest_by_product(db, product.id)
        # ... format dates ...

        # Construct proper dictionary
        product_dict = {
            "id": product.id,
            "name": product.name,
            # ... other fields ...
            "service_name": product.service.name if product.service else None,
            "status": status_name,  # String instead of object
            # ... payment info fields ...
        }
        result.append(product_dict)
    
    return result
```

## Impact
- ✅ Department products now load correctly when expanding the dropdown
- ✅ Assigned products are correctly displayed in the Edit Department panel
- ✅ Product status and payment information are included in responses
- ✅ Consistent with other product endpoints in the API

## Testing
To verify the fix:
1. Navigate to Admin → Department Master File
2. Click the expand arrow (▶) on any department row
3. Verify products are displayed correctly with badges
4. Click "Edit" on a department
5. Switch to "Product Assignments" tab
6. Verify previously assigned products are checked in the tree
7. Assign/unassign products and save
8. Reopen the Edit panel to confirm changes persist

## Related Files
- `server/app/api/api_v1/endpoints/departments.py` - API endpoint handler
- `server/app/crud/department.py` - CRUD operations for departments
- `server/app/schemas/service.py` - Product Pydantic schema definition
- `nextjs/app/(admin)/admin/departments/page.tsx` - Frontend department list page
- `nextjs/components/departments/DepartmentFormDialog.tsx` - Edit dialog component

## References
- Original requirement: `database/feat-v2/Employee-Dept-Tree/product_requirements_v3.md`
- API design: `database/feat-v2/Employee-Dept-Tree/api_design_v3.md`
- Similar fix pattern: `server/app/api/api_v1/endpoints/products.py` (GET /api/products endpoint)

