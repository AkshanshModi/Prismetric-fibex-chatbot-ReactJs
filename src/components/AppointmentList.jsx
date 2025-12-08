import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, User, Wrench, CheckCircle, AlertCircle, Trash2, Eye, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Appointment Display Component
const AppointmentList = ({ appointments, onDeleteAppointment }) => {
    const { t } = useLanguage();
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    if (!appointments || appointments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('appointments.noAppointments')}</h3>
                <p className="text-gray-500">{t('appointments.useChatbot')}</p>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('appointments.confirmed')}
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {t('appointments.pending')}
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {t('appointments.cancelled')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {t('appointments.confirmed')}
                    </span>
                );
        }
    };

    const handleViewDetails = (appointment) => {
        setSelectedAppointment(appointment);
    };

    const closeModal = () => {
        setSelectedAppointment(null);
    };

    const formatDateToDDMMYYYY = (dateString) => {
        if (!dateString) return dateString;
        
        // Check if the date is in MM/DD/YYYY format
        const mmddyyyyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = dateString.match(mmddyyyyPattern);
        
        if (match) {
            const [, month, day, year] = match;
            return `${day}/${month}/${year}`;
        }
        
        // If format doesn't match, return as is
        return dateString;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('appointments.yourAppointments')}</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {appointments.length} {appointments.length === 1 ? t('appointments.appointment') : t('appointments.appointments')}
                </span>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.appointmentId')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.customerName')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.contact')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.dateTime')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.issue')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.address')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('appointments.status')}
                                </th>
                                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th> */}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appointments.map((appointment, index) => {
                                const customer = appointment.customer || {};
                                const service = appointment.service || {};
                                const appointmentId = appointment.appointment_id || appointment.id;
                                const status = appointment.status || 'confirmed';

                                return (
                                    <tr key={appointmentId || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-blue-600">
                                                {appointmentId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm font-medium text-gray-900">
                                                    {customer.name || t('appointments.na')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                <div className="text-sm text-gray-900">
                                                    {customer.contact_number || t('appointments.na')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                <div className="flex items-center mb-1">
                                                    <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                                                    {service.date ? formatDateToDDMMYYYY(service.date) : t('appointments.na')}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                                    {service.time || t('appointments.na')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {service.customer_requirement || t('appointments.na')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {customer.address || t('appointments.na')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(status)}
                                        </td>
                                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleViewDetails(appointment)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                                                    title={t('appointments.viewDetails')}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {onDeleteAppointment && (
                                                    <button
                                                        onClick={() => onDeleteAppointment(appointmentId)}
                                                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                                        title={t('appointments.cancelAppointment')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td> */}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">{t('appointments.appointmentDetails')}</h3>
                                <button
                                    onClick={closeModal}
                                    className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Appointment ID */}
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                                <p className="text-sm text-gray-600 mb-1">{t('appointments.appointmentId')}</p>
                                <p className="text-lg font-bold text-blue-600">
                                    {selectedAppointment.appointment_id || selectedAppointment.id}
                                </p>
                            </div>

                            {/* Customer Information */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-blue-600" />
                                    {t('appointments.customerInformation')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.name')}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedAppointment.customer?.name || t('appointments.na')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.contactNumber')}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedAppointment.customer?.contact_number || t('appointments.na')}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.address')}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedAppointment.customer?.address || t('appointments.na')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Service Information */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                    <Wrench className="h-5 w-5 mr-2 text-blue-600" />
                                    {t('appointments.serviceInformation')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.serviceType')}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedAppointment.service?.type || t('appointments.na')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.date')}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedAppointment.service?.date ? formatDateToDDMMYYYY(selectedAppointment.service.date) : t('appointments.na')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.time')}</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedAppointment.service?.time || t('appointments.na')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{t('appointments.status')}</p>
                                        <div>{getStatusBadge(selectedAppointment.status || 'confirmed')}</div>
                                    </div>
                                    {selectedAppointment.service?.customer_issue && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">{t('appointments.issueDescription')}</p>
                                            <p className="text-sm text-gray-900">
                                                {selectedAppointment.service.customer_issue}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Created At */}
                            {selectedAppointment.created_at && (
                                <div className="text-xs text-gray-400 pt-4 border-t">
                                    {t('appointments.created')}: {new Date(selectedAppointment.created_at).toLocaleString()}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
                            <button
                                onClick={closeModal}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                {t('appointments.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentList;