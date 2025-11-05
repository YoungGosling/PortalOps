'use client';

import type { WorkflowTask, ProductWithServiceAdmin } from '@/types';

interface PrintableChecklistProps {
  task: WorkflowTask;
  selectedProducts: ProductWithServiceAdmin[];
}

export function PrintableChecklist({ task, selectedProducts }: PrintableChecklistProps) {
  const isOnboarding = task.type === 'onboarding';
  const title = isOnboarding
    ? 'OnBoarding Access Central Checklist'
    : 'OffBoarding Access Central Checklist';

  return (
    <div className="print-checklist">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-checklist,
          .print-checklist * {
            visibility: visible;
          }
          .print-checklist {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            color: #000;
            background: #fff;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
          }
          .print-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 0;
            text-align: center;
          }
          .print-section {
            margin-bottom: 25px;
          }
          .print-section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #666;
            padding-bottom: 5px;
          }
          .print-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 20px;
            margin-bottom: 15px;
          }
          .print-info-item {
            display: flex;
            flex-direction: column;
          }
          .print-label {
            font-size: 9pt;
            color: #666;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .print-value {
            font-size: 11pt;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            min-height: 20px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            font-size: 10pt;
            font-weight: bold;
          }
          .print-table td {
            border: 1px solid #000;
            padding: 8px;
            font-size: 10pt;
            vertical-align: top;
          }
          .print-checkbox-col {
            text-align: center;
            width: 80px;
          }
          .print-checkbox {
            display: none;
          }
          .print-date-field {
            display: inline-block;
            width: 100%;
            min-height: 20px;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}} />

      <div className="print-header">
        <h1 className="print-title">PortalOps - Enterprise Service Management</h1>
        <h2 className="print-title" style={{ marginTop: '10px' }}>{title}</h2>
      </div>

      <div className="print-section">
        <h2 className="print-section-title">Employee Information</h2>
        <div className="print-info-grid">
          <div className="print-info-item">
            <div className="print-label">Employee Name</div>
            <div className="print-value">{task.employee_name}</div>
          </div>
          <div className="print-info-item">
            <div className="print-label">Email</div>
            <div className="print-value">{task.employee_email}</div>
          </div>
          <div className="print-info-item">
            <div className="print-label">Department</div>
            <div className="print-value">{task.employee_department || 'N/A'}</div>
          </div>
          <div className="print-info-item">
            <div className="print-label">Position</div>
            <div className="print-value">{task.employee_position || 'N/A'}</div>
          </div>
          <div className="print-info-item">
            <div className="print-label">
              {isOnboarding ? 'Hire Date' : 'Hire Date'}
            </div>
            <div className="print-value">{task.employee_hire_date || 'N/A'}</div>
          </div>
          {!isOnboarding && (
            <div className="print-info-item">
              <div className="print-label">Resignation Date</div>
              <div className="print-value">{task.employee_resignation_date || 'N/A'}</div>
            </div>
          )}
        </div>
      </div>

      <div className="print-section">
        <h2 className="print-section-title">Product Access Assignment</h2>
        {selectedProducts && selectedProducts.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Service Provider</th>
                <th style={{ width: '20%' }}>Product</th>
                <th style={{ width: '25%' }}>Provider Admin</th>
                <th className="print-checkbox-col">
                  {isOnboarding ? 'Assign' : 'Delete'}
                </th>
                <th style={{ width: '20%' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((product, index) => (
                <tr key={index}>
                  <td>{product.service_name}</td>
                  <td>{product.product_name}</td>
                  <td>
                    {product.service_admins.length > 0
                      ? product.service_admins.map(a => a.name).join(' / ')
                      : 'N/A'}
                  </td>
                  <td className="print-checkbox-col">
                    
                  </td>
                  <td>
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No products assigned</p>
        )}
      </div>

      <div className="print-section" style={{ marginTop: '40px' }}>
        <div className="print-info-grid">
          <div className="print-info-item">
            <div className="print-label">Reporter</div>
            <div className="print-value"></div>
          </div>
          <div className="print-info-item">
            <div className="print-label">Date Completed</div>
            <div className="print-value"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

