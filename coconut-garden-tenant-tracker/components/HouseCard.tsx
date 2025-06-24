

import React from 'react';
import { Tenant, Payment, PaymentStatus, HouseWithTenantAndPayment } from '../types'; 
import { RENT_DUE_DAY, CURRENCY_SYMBOL } from '../constants';
import { UserCircleIcon, EnvelopeIcon, PhoneIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, EyeIcon, UserPlusIcon, UserMinusIcon, PencilIcon, UserGroupIcon } from './icons'; 
import { formatDate_dd_mmm_yyyy } from '../services/formatService';
// HouseWithTenantAndPayment is now imported from ../types

interface HouseCardProps {
  house: HouseWithTenantAndPayment; 
  // tenant and paymentForCurrentMonth are now part of house prop
  onAssignTenant: (houseId: string) => void; // For new tenants
  onAssignExistingTenant: (houseId: string, houseNumber: string) => void; // For existing tenants
  onRemoveTenantFromHouse: (houseId: string, tenantId: string) => void;
  onModifyTenant: (tenant: Tenant) => void;
  onRecordPayment: (tenant: Tenant) => void;
  onSendReminder: (tenant: Tenant) => void;
  onViewTenantDetails: (tenant: Tenant) => void;
  isSubmitting: boolean;
}

const getStatusDisplayProps = (
    status: PaymentStatus, 
    paymentDate?: string | null,
    isNewTenantThisMonthAfterDueDay?: boolean
) => {
  let text = "Rent Unpaid";
  let colorClasses = "bg-warning-100 text-warning-800";
  let Icon = XCircleIcon;
  let bannerBg = "bg-warning-500";
  let bannerText = "text-warning-950";

  switch (status) {
    case PaymentStatus.Paid:
      text = `Paid on ${formatDate_dd_mmm_yyyy(paymentDate || new Date())}`;
      colorClasses = "bg-success-100 text-success-800";
      Icon = CheckCircleIcon;
      bannerBg = "bg-success-500";
      bannerText = "text-white";
      break;
    case PaymentStatus.Overdue:
      text = "Rent Overdue";
      colorClasses = "bg-error-100 text-error-800";
      Icon = ExclamationTriangleIcon;
      bannerBg = "bg-error-500";
      bannerText = "text-white";
      break;
    case PaymentStatus.Unpaid:
      if (isNewTenantThisMonthAfterDueDay) {
        text = "Rent Unpaid (New Tenant)";
      } else {
        text = "Rent Unpaid";
      }
      break;
  }
  return { text, colorClasses, Icon, bannerBg, bannerText };
};


const HouseCard: React.FC<HouseCardProps> = ({
  house, 
  onAssignTenant,
  onAssignExistingTenant,
  onRemoveTenantFromHouse,
  onModifyTenant,
  onRecordPayment,
  onSendReminder,
  onViewTenantDetails,
  isSubmitting
}) => {
  const currentTenant = house.tenant;
  const currentPaymentForMonth = house.paymentForCurrentMonth;
  const currentPaymentStatus = house.paymentStatus;
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  let isNewTenantJoinedThisMonthAfterDueDay = false;
  if (currentTenant && currentPaymentStatus === PaymentStatus.Unpaid) {
    const joinDate = new Date(currentTenant.join_date);
    isNewTenantJoinedThisMonthAfterDueDay =
      joinDate.getFullYear() === currentYear &&
      joinDate.getMonth() + 1 === currentMonth &&
      joinDate.getDate() > RENT_DUE_DAY;
  }
  
  const { 
    text: statusText, 
    colorClasses: statusColorClasses, 
    Icon: IconComponent, 
    bannerBg: topBannerBg, 
    bannerText: topBannerText 
  } = getStatusDisplayProps(currentPaymentStatus, currentPaymentForMonth?.paid_date, isNewTenantJoinedThisMonthAfterDueDay);

  const canSendReminder = currentTenant && (currentPaymentStatus === PaymentStatus.Unpaid || currentPaymentStatus === PaymentStatus.Overdue) && today.getDate() > RENT_DUE_DAY;

  const cardBaseClasses = "bg-accent-100 shadow-xl rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl text-accent-900 flex flex-col";
  
  return (
    <div className={cardBaseClasses} style={{ minHeight: '380px' }}>
      <div className={`px-5 py-3 ${currentTenant ? topBannerBg : 'bg-accent-400'} ${currentTenant ? topBannerText : 'text-accent-800'} flex justify-between items-center`}>
        <h3 className="text-2xl font-bold">House {house.house_number}</h3>
        {currentTenant && (
          <span className={`text-sm font-semibold px-3 py-1 rounded-full flex items-center ${statusColorClasses} bg-opacity-20 backdrop-blur-sm`}>
            <IconComponent className="w-5 h-5 mr-1.5" />
            {currentPaymentStatus === PaymentStatus.Paid ? `Paid: ${formatDate_dd_mmm_yyyy(currentPaymentForMonth!.paid_date!)}` : currentPaymentStatus}
          </span>
        )}
      </div>

      <div className="p-5 space-y-3 flex-grow">
        {currentTenant ? (
          <>
            <div className="flex items-center text-primary-800">
              <UserCircleIcon className="w-6 h-6 mr-2 text-primary-500" />
              <span className="text-lg font-semibold truncate" title={currentTenant.name}>{currentTenant.name}</span>
            </div>
            <div className="flex items-center text-primary-700 text-sm">
              <EnvelopeIcon className="w-5 h-5 mr-2 text-primary-500" />
              <span>{currentTenant.email}</span>
            </div>
            <div className="flex items-center text-primary-700 text-sm">
              <PhoneIcon className="w-5 h-5 mr-2 text-primary-500" />
              <span>{currentTenant.phone || 'N/A'}</span>
            </div>
            <div className="text-primary-800 font-medium">
              Rent: {CURRENCY_SYMBOL}{currentTenant.rent_amount.toFixed(2)} / month
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
        {currentTenant ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onRecordPayment(currentTenant)}
                disabled={isSubmitting || currentPaymentStatus === PaymentStatus.Paid}
                className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>{currentPaymentStatus === PaymentStatus.Paid ? 'Paid' : 'Mark Paid'}</span>
              </button>
              <button
                onClick={() => onSendReminder(currentTenant)}
                disabled={isSubmitting || !canSendReminder}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span>Reminder</span>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
                 <button
                onClick={() => onViewTenantDetails(currentTenant)}
                disabled={isSubmitting}
                className="w-full bg-accent-300 hover:bg-accent-400 text-primary-800 font-semibold py-2 px-3 rounded-md text-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-70"
              >
                <EyeIcon className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onModifyTenant(currentTenant)}
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded-md text-xs flex items-center justify-center space-x-1 transition-colors disabled:opacity-70"
              >
                <PencilIcon className="w-3 h-3" />
                <span>Modify</span>
              </button>
              <button
                onClick={() => onRemoveTenantFromHouse(house.id, currentTenant.id)}
                disabled={isSubmitting}
                className="w-full bg-error-500 hover:bg-error-600 text-white font-semibold py-2 px-3 rounded-md text-xs flex items-center justify-center space-x-1 transition-colors disabled:opacity-70"
              >
                <UserMinusIcon className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => onAssignTenant(house.id)}
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <UserPlusIcon className="w-5 h-5" />
              <span>Assign New Tenant</span>
            </button>
            <button
              onClick={() => onAssignExistingTenant(house.id, house.house_number)}
              disabled={isSubmitting}
              className="w-full bg-success-500 hover:bg-success-600 text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>Assign Existing Tenant</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HouseCard;