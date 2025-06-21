
import React from 'react';
import { Tenant, Payment, PaymentStatus } from '../../types'; 
import Modal from './Modal';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, BriefcaseIcon, CalendarDaysIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, TrashIcon, ShieldCheckIcon, ShieldExclamationIcon } from '../icons';
import { CURRENCY_SYMBOL } from '../../constants';
import { formatDate_dd_mmm_yyyy } from '../../services/geminiService';

interface TenantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  payments: Payment[]; 
  onTriggerRecordPayment: (month: number, year: number, default_amount_paid: number) => void; 
  onTriggerDeleteConfirmation: (tenantId: string, tenantName: string) => void; 
  isSubmitting?: boolean;
}

const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  tenant, 
  payments, 
  onTriggerRecordPayment,
  onTriggerDeleteConfirmation, 
  isSubmitting 
}) => {
  if (!tenant) return null;

  const getPaymentStatusForMonthYear = (month: number, year: number): { status: PaymentStatus; paymentRecord: Payment | undefined } => {
    const paymentRecordsForMonth = payments
        .filter(p => p.month === month && p.year === year)
        .sort((a,b) => new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime()); 
    
    const payment = paymentRecordsForMonth[0];

    if (payment && payment.paid_date) { 
      return { status: PaymentStatus.Paid, paymentRecord: payment };
    }
    
    const today = new Date();
    const dateToCheck = new Date(year, month - 1, 1); 
    if (dateToCheck < new Date(today.getFullYear(), today.getMonth(), 1) && (!payment || !payment.paid_date)) { 
         return { status: PaymentStatus.Overdue, paymentRecord: payment };
    }
    return { status: PaymentStatus.Unpaid, paymentRecord: payment };
  };
  
  const paymentHistory = [];
  const startDate = new Date(tenant.join_date); 
  const endDate = new Date(); 

  for (let y = startDate.getFullYear(); y <= endDate.getFullYear(); y++) {
    const startMonth = (y === startDate.getFullYear()) ? startDate.getMonth() + 1 : 1;
    const endMonthLoop = (y === endDate.getFullYear()) ? endDate.getMonth() + 1 : 12;
    for (let m = startMonth; m <= endMonthLoop; m++) {
      paymentHistory.push({ year: y, month: m, ...getPaymentStatusForMonthYear(m,y) });
    }
  }
  paymentHistory.sort((a,b) => new Date(b.year, b.month-1).getTime() - new Date(a.year, a.month-1).getTime());

  const handleDeleteTrigger = () => { 
    if (tenant) {
      onTriggerDeleteConfirmation(tenant.id, tenant.name); 
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tenant Details" size="xl">
      <div className="space-y-6">
        <div className="p-4 border border-accent-200 rounded-lg bg-accent-200">
          <div className="flex items-center space-x-3 mb-4">
            <UserCircleIcon className="w-12 h-12 text-primary-500" />
            <h3 className="text-2xl font-semibold text-primary-800">{tenant.name}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm text-primary-700">
            <p className="flex items-center"><EnvelopeIcon className="w-5 h-5 mr-2 text-primary-500" /> {tenant.email}</p>
            <p className="flex items-center"><PhoneIcon className="w-5 h-5 mr-2 text-primary-500" /> {tenant.phone || 'N/A'}</p>
            <p className="flex items-center col-span-1 md:col-span-2"><BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" /> <span className="font-medium">Work:</span>&nbsp;{tenant.work_info || 'N/A'}</p> 
            <p className="flex items-center"><CalendarDaysIcon className="w-5 h-5 mr-2 text-primary-500" /> <span className="font-medium">Joined:</span>&nbsp;{formatDate_dd_mmm_yyyy(tenant.join_date)}</p> 
            <p className="flex items-center"><span className="text-lg font-semibold text-primary-500 mr-2">{CURRENCY_SYMBOL}{tenant.rent_amount.toFixed(2)}</span> per month</p> 
            <p className="flex items-center">
              {tenant.id_proof ? <ShieldCheckIcon className="w-5 h-5 mr-2 text-success-500" /> : <ShieldExclamationIcon className="w-5 h-5 mr-2 text-error-500" />} 
              <span className="font-medium">ID Proof:</span>&nbsp;{tenant.id_proof ? 'Submitted' : 'Not Submitted'} 
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-medium text-primary-700 mb-2">Payment History</h4>
          {paymentHistory.length === 0 ? (
            <p className="text-accent-700">No payment history available yet.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-accent-300 rounded-md">
              <table className="min-w-full divide-y divide-accent-300">
                <thead className="bg-accent-300 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Month/Year</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Paid On</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-accent-200">
                  {paymentHistory.map(item => {
                    const monthName = new Date(item.year, item.month - 1).toLocaleString('default', { month: 'short' });
                    let statusColor = '';
                    let StatusIcon = XCircleIcon; // Default
                    if (item.status === PaymentStatus.Paid) {
                      statusColor = 'text-success-500';
                      StatusIcon = CheckCircleIcon;
                    } else if (item.status === PaymentStatus.Overdue) {
                      statusColor = 'text-error-500';
                      StatusIcon = ExclamationTriangleIcon;
                    } else { // Unpaid
                      statusColor = 'text-warning-500';
                    }

                    return (
                      <tr key={`${item.year}-${item.month}`} className="hover:bg-accent-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-800">{monthName} {item.year}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${statusColor} flex items-center`}>
                          <StatusIcon className={`w-5 h-5 mr-1.5`} />
                          {item.status}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-700">
                          {item.paymentRecord?.paid_date ? formatDate_dd_mmm_yyyy(item.paymentRecord.paid_date) : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-accent-700">
                          {item.paymentRecord?.amount_paid ? `${CURRENCY_SYMBOL}${item.paymentRecord.amount_paid.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {item.status !== PaymentStatus.Paid && (
                            <button 
                              onClick={() => onTriggerRecordPayment(item.month, item.year, tenant.rent_amount)}
                              disabled={isSubmitting}
                              className="text-primary-500 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-accent-300">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-primary-800 bg-accent-200 hover:bg-accent-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Close
          </button>
          <button
            onClick={handleDeleteTrigger}
            type="button"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-error-500 hover:bg-error-600 rounded-md shadow-sm flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4"/>
            <span>Delete Tenant</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TenantDetailsModal;
