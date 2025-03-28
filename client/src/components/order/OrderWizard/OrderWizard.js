import React, { useState, useEffect } from 'react';
import { 
  CustomerInfo, 
  VehicleSelection, 
  RouteSelection,
  DocumentsInfo,
  OrderSummary 
} from './OrderSteps';
import './OrderWizard.css';
import { vehicles } from '../../../data/vehicles';

const OrderWizard = ({ onSubmit, onCancel, initialData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState({
    customerInfo: null,
    vehicle: null,
    route: {
      startPoint: '',
      endPoints: [''],
      dateTime: null
    },
    documents: {
      comment: '',
      waybill: null
    }
  });

  // Инициализируем форму данными при их наличии
  useEffect(() => {
    if (initialData) {
      console.log('OrderWizard initialData:', initialData);
      
      setOrderData({
        customerInfo: initialData.customerInfo || null,
        vehicle: vehicles.find(v => v.id === initialData.vehicleTypeId),
        vehicleType: initialData.vehicleType,
        vehicleTypeId: initialData.vehicleTypeId,
        route: {
          startPoint: Array.isArray(initialData.route?.points) ? 
            initialData.route.points[0] : 
            initialData.route?.startPoint || '',
          endPoints: Array.isArray(initialData.route?.points) ? 
            initialData.route.points.slice(1) : 
            initialData.route?.endPoints || [''],
          dateTime: initialData.route?.dateTime || null,
          estimatedEndTime: initialData.route?.estimatedEndTime || null
        },
        documents: {
          comment: initialData.comment || '',
          waybill: initialData.documents?.waybill || initialData.documents?.[0] || null,
          waybillName: initialData.documents?.waybillName || initialData.documents?.[0]?.originalName || '',
          removeWaybill: false
        }
      });
    }
  }, [initialData, vehicles]);

  const steps = [
    { title: 'Данные заказчика', component: CustomerInfo },
    { title: 'Выбор транспорта', component: VehicleSelection },
    { title: 'Маршрут', component: RouteSelection },
    { title: 'Дополнения', component: DocumentsInfo },
    { title: 'Подтверждение', component: OrderSummary }
  ];

  const handleNext = (stepData) => {
    // Сохраняем флаг removeWaybill при переходе между шагами
    const updatedData = {
      ...orderData,
      ...stepData,
      documents: {
        ...orderData.documents,
        ...stepData.documents,
        // Сохраняем флаг removeWaybill если он был установлен
        removeWaybill: stepData.documents?.removeWaybill || orderData.documents?.removeWaybill
      }
    };
    setOrderData(updatedData);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    const submitData = {
      vehicleTypeId: orderData.vehicle?.id || orderData.vehicle,
      customerId: orderData.customerInfo?.id,
      customerInfo: {
        fullName: orderData.customerInfo.fullName,
        contact: orderData.customerInfo.contact,
        position: orderData.customerInfo.position,
        subdivision: orderData.customerInfo.subdivision,
        email: orderData.customerInfo.email
      },
      route: {
        startPoint: orderData.route.startPoint,
        endPoints: orderData.route.endPoints,
        dateTime: orderData.route.dateTime,
        estimatedEndTime: orderData.route.estimatedEndTime
      },
      comment: orderData.documents?.comment || '',
      documents: {
        waybill: orderData.documents?.waybill || null,
        removeWaybill: orderData.documents?.removeWaybill
      }
    };
    onSubmit(submitData);
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="order-wizard d-flex">
      <div className="wizard-sidebar">
        <div className="steps-progress">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step d-flex align-center gap-3 ${
                currentStep === index ? 'active' : ''
              } ${index < currentStep ? 'completed' : ''}`}
            >
              <div className="step-number d-flex align-center justify-center">
                {index + 1}
              </div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="wizard-main flex-1">
        <div className="wizard-content">
          <CurrentStepComponent
            data={orderData}
            onNext={handleNext}
            onBack={handleBack}
            onSubmit={currentStep === steps.length - 1 ? handleSubmit : undefined}
            onCancel={onCancel}
            isEditing={!!initialData}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderWizard; 