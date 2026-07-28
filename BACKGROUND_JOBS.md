# RajCivic Connect — Background Jobs & Worker Queue Architecture

## 1. Overview
Heavy computational or non-blocking tasks (PDF report generation, SLA escalation sweeps, batch notifications) are delegated to the background queue (`backgroundJobService.js`).

## 2. Supported Job Types
- `SLA_SWEEP`: Automated evaluation of complaint deadline compliance.
- `REPORT_EXPORT`: Heavy export processing for PDF/CSV reports.
- `BATCH_NOTIFICATION`: Multi-recipient alert dispatching.

## 3. Production Adapter Scaling
In high-volume production deployments, `backgroundJobService.js` can be backed by Redis / BullMQ workers by updating the queue transport config.
