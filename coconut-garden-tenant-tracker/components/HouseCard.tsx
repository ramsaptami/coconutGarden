
import React from 'react';
import { House, Tenant, Payment, PaymentStatus } from '../../types';
import { RENT_DUE_DAY, CURRENCY_SYMBOL } from '../../constants';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, EyeIcon, UserPlusIcon, UserMinusIcon, PencilIcon } from './icons'; // Changed from @/icons
import { formatDate_dd_mmm_yyyy } from '../../services/formatService';

interface HouseCardProps {
  house: House;
  tenant: Tenant | null;
  paymentForCurrentMonth?: Payment;
  onAssignTenant: (houseId: string) => void;
  onRemoveTenantFromHouse: (houseId: string, tenantId: string) => void;
  onModifyTenant: (tenant: Tenant) => void;
  onRecordPayment: (tenant: Tenant) => void;
  onSendReminder: (tenant: Tenant) => void;
  onViewTenantDetails: (tenant: Tenant) => void;
  isSubmitting: boolean;
}

const HouseCard: React.FC<HouseCardProps> = ({
  house,
  tenant,
  paymentForCurrentMonth,
  onAssignTenant,
  onRemoveTenantFromHouse,
  onModifyTenant,
  onRecordPayment,
  onSendReminder,
  onViewTenantDetails,
  isSubmitting
}) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let status: PaymentStatus = PaymentStatus.Unpaid;
  let statusText = "Rent Unpaid";
  let statusColorClasses = "bg-warning-100 text-warning-800";
  let IconComponent = XCircleIcon;
  let topBannerBg = "bg-warning-500";
  let topBannerText = "text-warning-950";

  if (tenant) {
    if (paymentForCurrentMonth && paymentForCurrentMonth.paid_date) {
      status = PaymentStatus.Paid;
      statusText = `Paid on ${formatDate_dd_mmm_yyyy(paymentForCurrentMonth.paid_date)}`;
      statusColorClasses = "bg-success-100 text-success-800";
      IconComponent = CheckCircleIcon;
      topBannerBg = "bg-success-500";
      topBannerText = "text-white";
    } else if (today.getDate() > RENT_DUE_DAY) {
      const joinDate = new Date(tenant.join_date);
      const isNewTenantThisMonthAfterDueDay =
        joinDate.getFullYear() === currentYear &&
        joinDate.getMonth() + 1 === currentMonth &&
        joinDate.getDate() > RENT_DUE_DAY;

      if (!isNewTenantThisMonthAfterDueDay) {
        status = PaymentStatus.Overdue;
        statusText = "Rent Overdue";
        statusColorClasses = "bg-error-100 text-error-800";
        IconComponent = ExclamationTriangleIcon;
        topBannerBg = "bg-error-500";
        topBannerText = "text-white";
      } else {
        statusText = "Rent Unpaid (New Tenant)";
      }
    }
  }

  const canSendReminder = tenant && (status === PaymentStatus.Unpaid || status === PaymentStatus.Overdue) && today.getDate() > RENT_DUE_DAY;

  const cardBaseClasses = "bg-accent-100 shadow-xl rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl text-accent-900 flex flex-col";
  
  return (
    <div className={cardBaseClasses} style={{ minHeight: '380px' }}> {/* Ensure consistent card height */}
      <div className={`px-5 py-3 ${tenant ? topBannerBg : 'bg-accent-400'} ${tenant ? topBannerText : 'text-accent-800'} flex justify-between items-center`}>
        <h3 className="text-2xl font-bold">House {house.house_number}</h3>
        {tenant && (
          <span className={`text-sm font-semibold px-3 py-1 rounded-full flex items-center ${statusColorClasses} bg-opacity-20 backdrop-blur-sm`}>
            <IconComponent className="w-5 h-5 mr-1.5" />
            {status === PaymentStatus.Paid ? `Paid: ${formatDate_dd_mmm_yyyy(paymentForCurrentMonth!.paid_date!)}` : status}
          </span>
        )}
      </div>

      <div className="p-5 space-y-3 flex-grow">
        {tenant ? (
          <>
            <div className="flex items-center text-primary-800">
              <UserCircleIcon className="w-6 h-6 mr-2 text-primary-500" />
              <span className="text-lg font-semibold truncate" title={tenant.name}>{tenant.name}</span>
            </div>
            <div className="flex items-center text-primary-700 text-sm">
              <EnvelopeIcon className="w-5 h-5 mr-2 text-primary-500" />
              <span>{tenant.email}</span>
            </div>
            <div className="flex items-center text-primary-700 text-sm">
              <PhoneIcon className="w-5 h-5 mr-2 text-primary-500" />
              <span>{tenant.phone || 'N/A'}</span>
            </div>
            <div className="text-primary-800 font-medium">
              Rent: {CURRENCY_SYMBOL}{tenant.rent_amount.toFixed(2)} / month
            </div>
            <div className={`mt-2 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center ${statusColorClasses}`}>
              <IconComponent className="w-5 h-5 mr-2" />
              {statusText}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <UserCircleIcon className="w-20 h-20 text-accent-400 mb-3" />
            <p className="text-xl font-semibold text-accent-600">Vacant</p>
            <p className="text-sm text-accent-500">This house is currently unoccupied.</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 bg-accent-200 border-t border-accent-300">
        {tenant ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onRecordPayment(tenant)}
                disabled={isSubmitting || status === PaymentStatus.Paid}
                className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{status === PaymentStatus.Paid ? 'Paid' : 'Mark Paid'}</span>
              </button>
              <button
                onClick={() => onSendReminder(tenant)}
                disabled={isSubmitting || !canSendReminder || status === PaymentStatus.Paid}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span>Reminder</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
                 <button
                onClick={() => onViewTenantDetails(tenant)}
                disabled={isSubmitting}
                className="w-full bg-accent-300 hover:bg-accent-400 text-primary-800 font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-70"
              >
                <EyeIcon className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onModifyTenant(tenant)}
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded-md text-xs flex items-center justify-center space-x-1 transition-colors disabled:opacity-70"
              >
                <PencilIcon className="w-3 h-3" />
                <span>Modify</span>
              </button>
              <button
                onClick={() => onRemoveTenantFromHouse(house.id, tenant.id)}
                disabled={isSubmitting}
                className="w-full bg-error-500 hover:bg-error-600 text-white font-semibold py-2 px-3 rounded-md text-xs flex items-center justify-center space-x-1 transition-colors disabled:opacity-70"
              >
                <UserMinusIcon className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onAssignTenant(house.id)}
            disabled={isSubmitting}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>Assign Tenant</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default HouseCard;

// Add new icons to icons.tsx if they don't exist
// UserPlusIcon, UserMinusIcon, PencilIcon
// For brevity, assuming they exist or will be added.
// If not, here are simple SVGs:

/*
export const UserPlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
  </svg>
);

export const UserMinusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5H6M15 12H9m12.75-4.5v-.11a6.375 6.375 0 0 0-12.75 0v.109A12.318 12.318 0 0 0 9.374 21c2.331 0 4.512-.645 6.374-1.766Z" />
  </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
*/
