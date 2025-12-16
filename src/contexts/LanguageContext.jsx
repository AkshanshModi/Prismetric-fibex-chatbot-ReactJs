import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    return localStorage.getItem('chatWidgetLanguage') || 'es';
  });

  useEffect(() => {
    // Save language preference to localStorage
    localStorage.setItem('chatWidgetLanguage', language);
  }, [language]);

  const translations = {
    en: {
      // ChatbotWidget
      chatbot: {
        greeting: "Hi! I'm your scheduling assistant. How can I help you today? ✨",
        placeholder: "Type your message...",
        assistant: "Assistant",
        alwaysHere: "Always here to help ✨",
        newConversation: "New conversation",
        close: "Close",
        startNewConversation: "Start New Conversation",
        connectionError: "⚠️ Sorry, I'm having trouble connecting. Please try again.",
        confirmMessage: "Please confirm your appointment details.",
        somethingWentWrong: "Something went wrong.",
        editAddress: "Edit Address",
        addAddress: "Add Address",
        selectAddressOnMap: "Select Address on Map",
        searchAddressPlaceholder: "Search for an address...",
        searching: "Searching...",
        search: "Search",
        selectedAddress: "Selected Address:",
        coordinates: "Coordinates:",
        mapInstructions: "Search for an address, click on the map, or drag the marker to select your location.",
        confirmAddress: "Confirm Address",
        cancel: "Cancel",
        selectLocationAlert: "Please select a location on the map",
        myAddressIs: "My address is:",
        searchAddressLabel: "Search Address",
        addressNotFound: "Address not found. Please try a different search term.",
        addressSearchError: "Error searching for address. Please try again.",
        coordinatesNotFound: "Your address coordinates were not found. Please edit the address using the 'Edit Address' button.",
        bookAppointment: "Book Appointment",
        selectDate: "Select Date",
        selectTime: "Select Time",
        selectAddress: "Select Address",
        confirmBooking: "Confirm Booking",
        pleaseSelectFutureDate: "Please select a future date",
        pleaseSelectTimeSlot: "Please select a time slot",
        pleaseSelectAddressOnMap: "Please select an address on the map",
        timeValidationError: "Please select a time between 9:00 AM and 6:00 PM (6:01 PM and later not allowed)",
        timeRangeError: "Time must be between 9 AM and 6 PM",
        selected: "Selected:",
        available: "Available:",
        timeRange: "9:00 AM - 6:00 PM",
        appointmentBookingMessage: "I would like to book an appointment on {date} at {time}. My address is {address}. Coordinates: {lat}, {lng}",
        confirmAppointment: "Confirm Appointment",
        appointmentDetails: "Appointment Details",
        no: "No",
        bookingConfirmed: "Booking confirmed successfully!",
        customerName: "Customer Name",
        customerPhone: "Customer Phone",
        customerEmail: "Email",
        phoneValidationError: "Phone number must be 10-11 digits",
        emailValidationError: "Please enter a valid email address",
        installationNotes: "Installation Notes",
        customerRequirement: "Customer Requirement",
        submitDetails: "Submit Details",
        hour: "Hour",
        minute: "Min",
        editDetails: "Edit Details",
        pastDateTimeNotAllowed: "Past date and time are not allowed. Please select a future date and time.",
        fieldRequired: "This field is required",
        enterFullName: "Enter the customer's full name as it should appear on the appointment.",
        enter10DigitPhone: "Enter a 10-digit phone number (no country code or symbols).",
        enterPhoneWithCountryCode: "Select country code and enter phone number.",
        phonePlaceholder: "04121234567",
        phonePlaceholderInternational: "Phone number",
        phoneValidationErrorInternational: "Phone number must be between 7 and 15 digits",
        fullPhoneNumber: "Full number",
        enterValidEmail: "Add a valid email for confirmations (optional if not required).",
        describeRequirement: "Select the issue or installation need from the dropdown list.",
        selectRequirement: "Select requirement",
        loading: "Loading...",
        dateInstruction: "Choose a date from tomorrow onward; past dates are disabled.",
        timeInstruction: "Pick a slot between 9:00 AM and 6:00 PM (local time).",
        addressInstruction: "Search for an address or click on the map to drop the marker where the service is needed.",
        addressHouseNumber: "House Number",
        addressSector: "Sector",
        addressCity: "City",
        addressState: "State",
        fullAddress: "Full Address",
        checkingViability: "Checking address availability...",
        addressNotInstallable: "This address is not available for installation service.",
        viabilityCheckError: "Unable to verify address availability. Please try again.",
      },
      // AppointmentList
      appointments: {
        noAppointments: "No appointments yet",
        useChatbot: "Use the chatbot to create your first appointment!",
        yourAppointments: "Your Appointments",
        appointment: "Appointment",
        appointments: "Appointments",
        appointmentId: "Appointment ID",
        customerName: "Customer Name",
        contact: "Contact",
        dateTime: "Date & Time",
        issue: "Issue",
        address: "Address",
        status: "Status",
        actions: "Actions",
        confirmed: "Confirmed",
        pending: "Pending",
        cancelled: "Cancelled",
        appointmentDetails: "Appointment Details",
        customerInformation: "Customer Information",
        serviceInformation: "Service Information",
        name: "Name",
        contactNumber: "Contact Number",
       
        serviceType: "Service Type",
        date: "Date",
        time: "Time",
        issueDescription: "Issue Description",
        created: "Created",
        close: "Close",
        viewDetails: "View details",
        cancelAppointment: "Cancel appointment",
        na: "N/A",
      },
      // TypingIndicator
      typing: {
        botIsTyping: "Bot is typing",
      },
    },
    es: {
      // ChatbotWidget
      chatbot: {
        greeting: "¡Hola! Soy tu asistente de programación. ¿Cómo puedo ayudarte hoy? ✨",
        placeholder: "Escribe tu mensaje...",
        assistant: "Asistente",
        alwaysHere: "Siempre aquí para ayudar ✨",
        newConversation: "Nueva conversación",
        close: "Cerrar",
        startNewConversation: "Iniciar Nueva Conversación",
        connectionError: "⚠️ Lo siento, estoy teniendo problemas para conectarme. Por favor, inténtalo de nuevo.",
        confirmMessage: "Por favor, confirma los detalles de tu cita.",
        somethingWentWrong: "Algo salió mal.",
        editAddress: "Editar Dirección",
        addAddress: "Agregar Dirección",
        selectAddressOnMap: "Seleccionar Dirección en el Mapa",
        searchAddressPlaceholder: "Buscar una dirección...",
        searching: "Buscando...",
        search: "Buscar",
        selectedAddress: "Dirección Seleccionada:",
        coordinates: "Coordenadas:",
        mapInstructions: "Busca una dirección, haz clic en el mapa o arrastra el marcador para seleccionar tu ubicación.",
        confirmAddress: "Confirmar Dirección",
        cancel: "Cancelar",
        selectLocationAlert: "Por favor, selecciona una ubicación en el mapa",
        myAddressIs: "Mi dirección es:",
        searchAddressLabel: "Buscar Dirección",
        addressNotFound: "Dirección no encontrada. Por favor, intenta con un término de búsqueda diferente.",
        addressSearchError: "Error al buscar la dirección. Por favor, inténtalo de nuevo.",
        coordinatesNotFound: "No se encontraron las coordenadas de su dirección. Por favor, edite la dirección usando el botón 'Editar Dirección'.",
        bookAppointment: "Reservar Cita",
        selectDate: "Seleccionar Fecha",
        selectTime: "Seleccionar Hora",
        selectAddress: "Seleccionar Dirección",
        confirmBooking: "Confirmar Reserva",
        pleaseSelectFutureDate: "Por favor, selecciona una fecha futura",
        pleaseSelectTimeSlot: "Por favor, selecciona un horario",
        pleaseSelectAddressOnMap: "Por favor, selecciona una dirección en el mapa",
        timeValidationError: "Por favor, selecciona una hora entre las 9:00 AM y las 6:00 PM (6:01 PM y posteriores no permitidas)",
        timeRangeError: "La hora debe estar entre las 9 AM y las 6 PM",
        selected: "Seleccionado:",
        available: "Disponible:",
        timeRange: "9:00 AM - 6:00 PM",
        appointmentBookingMessage: "Me gustaría reservar una cita el {date} a las {time}. Mi dirección es {address}. Coordenadas: {lat}, {lng}",
        confirmAppointment: "Confirmar Cita",
        appointmentDetails: "Detalles de la Cita",
        no: "No",
        bookingConfirmed: "¡Reserva confirmada exitosamente!",
        customerName: "Nombre del Cliente",
        customerPhone: "Número de Contacto",
        customerEmail: "Correo Electrónico",
        phoneValidationError: "El número de teléfono debe tener entre 10 y 11 dígitos",
        emailValidationError: "Por favor, ingrese una dirección de correo electrónico válida",
        installationNotes: "Notas de Instalación",
        customerRequirement: "Requisito del Cliente",
        submitDetails: "Enviar Detalles",
        hour: "Hora",
        minute: "Min",
        editDetails: "Editar Detalles",
        pastDateTimeNotAllowed: "No se permiten fechas y horas pasadas. Por favor, seleccione una fecha y hora futura.",
        fieldRequired: "Este campo es obligatorio",
        enterFullName: "Ingresa el nombre completo del cliente tal como debe aparecer en la cita.",
        enter10DigitPhone: "Introduce un número de teléfono de 10 dígitos (sin código de país ni símbolos).",
        enterPhoneWithCountryCode: "Selecciona el código de país e ingresa el número de teléfono.",
        phonePlaceholder: "04121234567",
        phonePlaceholderInternational: "Número de teléfono",
        phoneValidationErrorInternational: "El número de teléfono debe tener entre 7 y 15 dígitos",
        fullPhoneNumber: "Número completo",
        enterValidEmail: "Agrega un correo válido para confirmaciones (opcional si no es requerido).",
        describeRequirement: "Selecciona el problema o la necesidad de instalación de la lista desplegable.",
        selectRequirement: "Seleccionar requisito",
        loading: "Cargando...",
        dateInstruction: "Elige una fecha a partir de mañana; las fechas pasadas están deshabilitadas.",
        timeInstruction: "Selecciona un horario entre las 9:00 AM y las 6:00 PM (hora local).",
        addressInstruction: "Busca una dirección o haz clic en el mapa para colocar el marcador donde se necesita el servicio.",
        addressHouseNumber: "Número de casa",
        addressSector: "Sector",
        addressCity: "Ciudad",
        addressState: "Estado",
        fullAddress: "Dirección completa",
        checkingViability: "Verificando disponibilidad de la dirección...",
        addressNotInstallable: "Esta dirección no está disponible para el servicio de instalación.",
        viabilityCheckError: "No se pudo verificar la disponibilidad de la dirección. Por favor, inténtelo de nuevo.",
      },
      // AppointmentList
      appointments: {
        noAppointments: "Aún no hay citas",
        useChatbot: "¡Usa el chatbot para crear tu primera cita!",
        yourAppointments: "Tus Citas",
        appointment: "Cita",
        appointments: "Citas",
        appointmentId: "ID de Cita",
        customerName: "Nombre del Cliente",
        contact: "Contacto",
        dateTime: "Fecha y Hora",
        issue: "Problema",
        address: "Dirección",
        status: "Estado",
        actions: "Acciones",
        confirmed: "Confirmada",
        pending: "Pendiente",
        cancelled: "Cancelada",
        appointmentDetails: "Detalles de la Cita",
        customerInformation: "Información del Cliente",
        serviceInformation: "Información del Servicio",
        name: "Nombre",
        contactNumber: "Número de Contacto",
        serviceType: "Tipo de Servicio",
        date: "Fecha",
        time: "Hora",
        issueDescription: "Descripción del Problema",
        created: "Creada",
        close: "Cerrar",
        viewDetails: "Ver detalles",
        cancelAppointment: "Cancelar cita",
        na: "N/A",
      },
      // TypingIndicator
      typing: {
        botIsTyping: "El bot está escribiendo",
      },
    },
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

