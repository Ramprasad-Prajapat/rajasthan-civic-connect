# RajCivic Connect — Multi-City & Multi-ULB Architecture Guide

## 1. Governance Hierarchy Schema
```
State (Rajasthan)
  └── Division (e.g. Jaipur, Jodhpur, Udaipur, Kota, Ajmer)
        └── District (e.g. Jaipur, Jodhpur, Udaipur)
              └── ULB Type (Nagar Nigam / Nagar Parishad / Nagar Palika)
                    └── Department (Sanitation, PWD, Electrical, Water, Sewerage)
                          └── Ward Sector (Ward No. 01 – 150)
```

## 2. Multi-Tenant Document Models
Document entities include backward-compatible scope attributes:
```json
{
  "stateId": "RJ",
  "districtId": "JOD",
  "ulbId": "JOD-NNG-SOUTH",
  "ulbType": "Nagar Nigam",
  "wardId": "WARD-12",
  "departmentId": "SANITATION"
}
```
This enables scoped query filtering so municipal officers access only grievances within their administrative jurisdiction.
