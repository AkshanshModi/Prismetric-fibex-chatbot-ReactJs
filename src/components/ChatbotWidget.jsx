import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Sparkles, Languages, MessageCirclePlusIcon, MapPin, Calendar, Clock, Edit, Info, ChevronDown, Search } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SearchBox } from '@mapbox/search-js-react';



// API Configuration - fallback URLs
const API_CONFIG = {
    production: "http://27.54.168.101:4101",
    development: "http://192.168.0.54:8000"
};

// Get API base URL based on environment
const getApiBaseUrl = () => {
    // Check for custom API URL in environment variables (Vite uses VITE_ prefix)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Use production URL in production mode, development URL otherwise
    return import.meta.env.PROD
        ? API_CONFIG.production
        : API_CONFIG.development;
};

const API_BASE_URL = getApiBaseUrl();

// Read chatbot/widget identifier from the URL (supports query, hash, path)
const getChatbotIdFromUrl = () => {
    if (typeof window === "undefined") return null;

    const { search, hash, pathname } = window.location;

    // Check standard query string (?id=...)
    const searchParams = new URLSearchParams(search || "");
    const searchId = searchParams.get("id");
    if (searchId) {
        return searchId;
    }

    // Support hash-based routing (#/chatbot?id=...)
    if (hash?.includes("?")) {
        const hashQuery = hash.substring(hash.indexOf("?") + 1);
        const hashParams = new URLSearchParams(hashQuery);
        const hashId = hashParams.get("id");
        if (hashId) {
            return hashId;
        }
    }

    // Support /chatbot/<id> path style
    const pathSegments = pathname?.split("/").filter(Boolean) || [];
    if (pathSegments.length > 1) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment !== "chatbot") {
            return lastSegment;
        }
    }

    return null;
};

// Read token from the URL (supports query, hash, path)
const getTokenFromUrl = () => {
    if (typeof window === "undefined") return null;

    const { search, hash, pathname } = window.location;

    // Check standard query string (?token=...)
    const searchParams = new URLSearchParams(search || "");
    const token = searchParams.get("token");
    if (token) {
        return token;
    }

    // Support hash-based routing (#/chatbot?token=...)
    if (hash?.includes("?")) {
        const hashQuery = hash.substring(hash.indexOf("?") + 1);
        const hashParams = new URLSearchParams(hashQuery);
        const hashToken = hashParams.get("token");
        if (hashToken) {
            return hashToken;
        }
    }

    // Support /chatbot/<token> path style
    const pathSegments = pathname?.split("/").filter(Boolean) || [];
    if (pathSegments.length > 1) {
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment !== "chatbot") {
            return lastSegment;
        }
    }

    return null;
};

const resolveInitialChatbotId = (explicitId) => {
    if (explicitId) return explicitId;
    return getChatbotIdFromUrl();
};

// Custom Dropdown Component
const CustomDropdown = ({ 
    value, 
    onChange, 
    options = [], 
    placeholder = "Select...", 
    disabled = false, 
    error = false,
    className = "",
    minWidth = "auto",
    searchable = false,
    searchPlaceholder = "Search..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery(""); // Reset search when closing
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchQuery(""); // Reset search when closing
            }
        };

        // Add event listeners with a small delay to prevent immediate closure when opening
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('keydown', handleEscape);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    // Focus search input when dropdown opens and searchable is true
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen, searchable]);

    // Filter options based on search query
    // When searching, exclude placeholder options (empty value) and filter by search query
    const filteredOptions = searchable && searchQuery
        ? options.filter(option => {
            // Exclude placeholder options (empty value) from search results
            if (option.value === "") return false;
            return option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   (option.searchText && option.searchText.toLowerCase().includes(searchQuery.toLowerCase()));
        })
        : options;

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery(""); // Reset search after selection
    };

    const handleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchQuery(""); // Reset search when opening
            }
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef} style={{ minWidth }}>
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between ${
                    error ? 'border-red-500' : 'border-gray-300'
                } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white cursor-pointer hover:border-gray-400'}`}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {displayText}
                </span>
                <ChevronDown 
                    className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
                />
            </button>
            
            {isOpen && !disabled && (
                <div 
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 flex flex-col"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {searchable && (
                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-auto max-h-48">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
                        ) : (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                        value === option.value ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-900'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ChatbotWidget({ onAppointmentCreated, chatbotId: propChatbotId, id: propId }) {
   
    
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [confirmation, setConfirmation] = useState(false);
    const [messages, setMessages] = useState([
        { role: "bot", text: t('chatbot.greeting'), isHtml: false }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [chatbotId, setChatbotId] = useState(() => resolveInitialChatbotId(propChatbotId || propId));
    const [currentAppointmentDetails, setCurrentAppointmentDetails] = useState(null);
    const [lastUserMessageIndex, setLastUserMessageIndex] = useState(-1);
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
    const [confirmationAppointmentDetails, setConfirmationAppointmentDetails] = useState(null);
    const [showMapDialog, setShowMapDialog] = useState(false);
    const [addressInput, setAddressInput] = useState("");
    const [searchAddress, setSearchAddress] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState({ lat: null, lng: null, address: '' });
    const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedHour, setSelectedHour] = useState("");
    const [selectedMinute, setSelectedMinute] = useState("");
    const [selectedAmPm, setSelectedAmPm] = useState("AM");
    const [timeError, setTimeError] = useState("");
    const [appointmentLocation, setAppointmentLocation] = useState({ lat: null, lng: null, address: '' });
    const [appointmentSearchAddress, setAppointmentSearchAddress] = useState("");
    const [editableFullAddress, setEditableFullAddress] = useState("");
    const [isAppointmentSearching, setIsAppointmentSearching] = useState(false);
    const [customerLeadData, setCustomerLeadData] = useState(null);
    const [isLoadingCustomerLead, setIsLoadingCustomerLead] = useState(false);
    const [editableCustomerName, setEditableCustomerName] = useState("");
    const [editableCustomerPhone, setEditableCustomerPhone] = useState("");
    const [selectedCountryCode, setSelectedCountryCode] = useState("+58"); // Default to Venezuela
    const [editableCustomerEmail, setEditableCustomerEmail] = useState("");
    const [editableCustomerRequirement, setEditableCustomerRequirement] = useState("");
    const [editableHouseNumber, setEditableHouseNumber] = useState("");
    const [editableSector, setEditableSector] = useState("");
    const [editableCity, setEditableCity] = useState("");
    const [editableState, setEditableState] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [savedAddressDetails, setSavedAddressDetails] = useState({
        houseNumber: "",
        sector: "",
        city: "",
        state: ""
    });
    const [customerIssues, setCustomerIssues] = useState([]);
    const [isLoadingCustomerIssues, setIsLoadingCustomerIssues] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        name: "",
        phone: "",
        email: "",
        requirement: "",
        date: "",
        time: "",
        address: ""
    });
    const [isCheckingViability, setIsCheckingViability] = useState(false);
    const [viabilityError, setViabilityError] = useState("");

    // Keep the editable full address in sync with the latest appointment location address
    useEffect(() => {
        setEditableFullAddress(appointmentLocation.address || "");
    }, [appointmentLocation.address]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sessionInitializedRef = useRef(false);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const appointmentMapContainerRef = useRef(null);
    const appointmentMapRef = useRef(null);
    const appointmentMarkerRef = useRef(null);

    // Common country codes list
    const countryCodes = [
        { code: "+58", country: "Venezuela", flag: "🇻🇪" },
        { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
        { code: "+52", country: "Mexico", flag: "🇲🇽" },
        { code: "+57", country: "Colombia", flag: "🇨🇴" },
        { code: "+51", country: "Peru", flag: "🇵🇪" },
        { code: "+56", country: "Chile", flag: "🇨🇱" },
        { code: "+54", country: "Argentina", flag: "🇦🇷" },
        { code: "+55", country: "Brazil", flag: "🇧🇷" },
        { code: "+34", country: "Spain", flag: "🇪🇸" },
        { code: "+44", country: "UK", flag: "🇬🇧" },
        { code: "+33", country: "France", flag: "🇫🇷" },
        { code: "+49", country: "Germany", flag: "🇩🇪" },
        { code: "+39", country: "Italy", flag: "🇮🇹" },
        { code: "+86", country: "China", flag: "🇨🇳" },
        { code: "+91", country: "India", flag: "🇮🇳" },
        { code: "+81", country: "Japan", flag: "🇯🇵" },
        { code: "+82", country: "South Korea", flag: "🇰🇷" },
        { code: "+61", country: "Australia", flag: "🇦🇺" },
        { code: "+27", country: "South Africa", flag: "🇿🇦" },
        { code: "+971", country: "UAE", flag: "🇦🇪" },
    
        // ---- Additional Countries ----
        { code: "+31", country: "Netherlands", flag: "🇳🇱" },
        { code: "+32", country: "Belgium", flag: "🇧🇪" },
        { code: "+47", country: "Norway", flag: "🇳🇴" },
        { code: "+45", country: "Denmark", flag: "🇩🇰" },
        { code: "+46", country: "Sweden", flag: "🇸🇪" },
        { code: "+41", country: "Switzerland", flag: "🇨🇭" },
        { code: "+43", country: "Austria", flag: "🇦🇹" },
        { code: "+48", country: "Poland", flag: "🇵🇱" },
        { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
        { code: "+421", country: "Slovakia", flag: "🇸🇰" },
        { code: "+36", country: "Hungary", flag: "🇭🇺" },
        { code: "+40", country: "Romania", flag: "🇷🇴" },
        { code: "+30", country: "Greece", flag: "🇬🇷" },
        { code: "+90", country: "Turkey", flag: "🇹🇷" },
        { code: "+971", country: "UAE", flag: "🇦🇪" },
        { code: "+973", country: "Bahrain", flag: "🇧🇭" },
        { code: "+974", country: "Qatar", flag: "🇶🇦" },
        { code: "+965", country: "Kuwait", flag: "🇰🇼" },
        { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
        { code: "+968", country: "Oman", flag: "🇴🇲" },
        { code: "+92", country: "Pakistan", flag: "🇵🇰" },
        { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
        { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
        { code: "+66", country: "Thailand", flag: "🇹🇭" },
        { code: "+65", country: "Singapore", flag: "🇸🇬" },
        { code: "+60", country: "Malaysia", flag: "🇲🇾" },
        { code: "+62", country: "Indonesia", flag: "🇮🇩" },
        { code: "+63", country: "Philippines", flag: "🇵🇭" },
        { code: "+64", country: "New Zealand", flag: "🇳🇿" },
        { code: "+353", country: "Ireland", flag: "🇮🇪" },
        { code: "+370", country: "Lithuania", flag: "🇱🇹" },
        { code: "+371", country: "Latvia", flag: "🇱🇻" },
        { code: "+372", country: "Estonia", flag: "🇪🇪" },
        { code: "+373", country: "Moldova", flag: "🇲🇩" },
        { code: "+375", country: "Belarus", flag: "🇧🇾" },
        { code: "+380", country: "Ukraine", flag: "🇺🇦" },
        { code: "+7", country: "Russia", flag: "🇷🇺" },
        { code: "+98", country: "Iran", flag: "🇮🇷" },
        { code: "+20", country: "Egypt", flag: "🇪🇬" },
        { code: "+212", country: "Morocco", flag: "🇲🇦" },
        { code: "+234", country: "Nigeria", flag: "🇳🇬" },
        { code: "+254", country: "Kenya", flag: "🇰🇪" },
        { code: "+255", country: "Tanzania", flag: "🇹🇿" },
        { code: "+251", country: "Ethiopia", flag: "🇪🇹" }
    ];
    

    const cleanValue = (value) => {
        if (!value || value === 'N/A') return '';
        return value;
    };

    const extractCityState = (feature) => {
        const ctx = feature?.properties?.context || {};
        const city =
            cleanValue(ctx.locality?.name) ||
            cleanValue(feature?.properties?.locality) ||
            cleanValue(ctx.place?.name) ||
            cleanValue(feature?.properties?.place);
        const state =
            cleanValue(ctx.region?.name) ||
            cleanValue(feature?.properties?.region);
        return { city, state };
    };

    // Detect country code from a full phone string using known codes (choose longest match)
    const detectCountryCode = (phone) => {
        if (!phone) {
            return { countryCode: "+58", localNumber: "" };
        }
        // Ensure string
        const normalized = String(phone);
        // Pick the longest matching code from our list
        const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
        const matched = sortedCodes.find(({ code }) => normalized.startsWith(code));
        if (matched) {
            return {
                countryCode: matched.code,
                localNumber: normalized.substring(matched.code.length).trim()
            };
        }
        // Fallback: simple +<1-3 digits>
        const fallbackMatch = normalized.match(/^(\+\d{1,3})/);
        if (fallbackMatch) {
            return {
                countryCode: fallbackMatch[1],
                localNumber: normalized.substring(fallbackMatch[1].length).trim()
            };
        }
        // Default to Venezuela
        return { countryCode: "+58", localNumber: normalized.trim() };
    };

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Keep chatbotId in sync with props or URL changes
    useEffect(() => {
        if (propChatbotId && propChatbotId !== chatbotId) {
            setChatbotId(propChatbotId);
            return;
        }

        if (propId && propId !== chatbotId) {
            setChatbotId(propId);
            return;
        }

        if (!chatbotId) {
            const fallbackId = getChatbotIdFromUrl();
            if (fallbackId) {
                setChatbotId(fallbackId);
            }
        }
    }, [propChatbotId, propId, chatbotId]);

    // Update initial message when language changes
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'bot') {
            setMessages([{ role: "bot", text: t('chatbot.greeting'), isHtml: false, htmlContent: null }]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    const sendMessage = async (initialMessage = null, isInitialization = false, isAddressUpdate = false) => {
        const messageToSend = initialMessage !== null ? initialMessage : input.trim();



        // For initialization, allow empty message; for user input, require non-empty
        if (!isInitialization && (!messageToSend || isTyping)) return;

        // Validation: Check if previous response needed confirmation but coordinates are missing
        // Skip validation if this is an address update from the map dialog
        // if (!isInitialization && !isAddressUpdate && needsConfirmation && currentAppointmentDetails) {
        //     if (isAddressMissing(currentAppointmentDetails)) {
        //         // Show validation error message
        //         setMessages((prev) => [...prev, {
        //             role: "bot",
        //             text: t('chatbot.coordinatesNotFound'),
        //             isHtml: false,
        //             htmlContent: null
        //         }]);
        //         setIsTyping(false);
        //         setTimeout(() => {
        //             inputRef.current?.focus();
        //         }, 100);
        //         return; // Don't send the message to API
        //     }
        // }

        // Only add user message if it's not an initialization call
        if (!isInitialization) {
            const userMsg = { role: "user", text: messageToSend, isHtml: false };
            setMessages((prev) => {
                const newMessages = [...prev, userMsg];
                // Track the index of the last user message
                setLastUserMessageIndex(newMessages.length - 1);
                return newMessages;
            });
            setInput("");
            // Close map dialog when sending a new message
            if (showMapDialog) {
                setShowMapDialog(false);
                if (mapRef.current) {
                    mapRef.current.remove();
                    mapRef.current = null;
                }
                if (markerRef.current) {
                    markerRef.current.remove();
                    markerRef.current = null;
                }
            }
        }

        setIsTyping(true);

        try {
            // Call your FastAPI backend
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            console.log("User timezone:", timezone);
            const apiUrl = `${API_BASE_URL}/chatbot/chat`;
            console.log("API URL:", apiUrl);
            const activeChatbotId = chatbotId || getChatbotIdFromUrl();

            if (!chatbotId && activeChatbotId) {
                setChatbotId(activeChatbotId);
            }

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageToSend || "",
                    session_id: sessionId,
                    timezone: timezone,
                    id: activeChatbotId,
                    chatbot_id: activeChatbotId
                })
            });

            const data = await res.json();


            // Simulate typing delay for better UX
            setTimeout(() => {
                const appointmentDetails = data.appointmentDetails || {};
                const intent = appointmentDetails.intent;
                const htmlSummary = appointmentDetails.html_summary;

                // Track if response needs confirmation - check needs_confirmation flag or confirm_appointment intent
                const responseNeedsConfirmation =
                    intent === 'confirm_appointment';
                setNeedsConfirmation(responseNeedsConfirmation);

                // Store appointment details for address checking (always store if they exist)
                // Only update if we have new appointment details, don't clear if response doesn't have them
                if (appointmentDetails && Object.keys(appointmentDetails).length > 0) {
                    console.log("Storing appointment details:", appointmentDetails);
                    console.log("Customer data:", appointmentDetails.customer);
                    console.log("Last user message index:", lastUserMessageIndex);
                    console.log("Intent:", intent);
                    console.log("Needs confirmation:", responseNeedsConfirmation);
                    setCurrentAppointmentDetails(appointmentDetails);

                    // Persist address detail fields from appointment response for future edits
                    const cust = appointmentDetails.customer || {};
                    setSavedAddressDetails({
                        houseNumber: cleanValue(cust.house_number),
                        sector: cleanValue(cust.sector),
                        city: cleanValue(cust.city),
                        state: cleanValue(cust.state)
                    });

                    if (appointmentDetails.customer?.latitude && appointmentDetails.customer?.longitude) {
                        setSelectedLocation({
                            lat: appointmentDetails.customer.latitude,
                            lng: appointmentDetails.customer.longitude,
                            address: appointmentDetails.customer.address
                        });
                    }

                    // If needs confirmation or intent is confirm_appointment, show confirmation dialog
                    if (responseNeedsConfirmation && intent !== 'booking_confirmed') {
                        setConfirmationAppointmentDetails(appointmentDetails);
                        setShowConfirmationDialog(true);
                    } else {
                        // If coordinates are found, reset needsConfirmation
                        if (!isAddressMissing(appointmentDetails)) {
                            setNeedsConfirmation(false);
                        }
                    }
                } else {
                    console.log("No appointment details in response, keeping previous:", currentAppointmentDetails);
                    // Don't clear existing appointment details if response doesn't have them
                }

                const newMessages = [];



                // If there's an HTML summary, add it as a separate message
                if (htmlSummary != null && htmlSummary !== 'null' && htmlSummary.trim() !== '' && intent !== 'error') {
                    console.log("Response data:", htmlSummary);
                    newMessages.push({
                        role: "bot",
                        text: "",
                        isHtml: true,
                        htmlContent: htmlSummary
                    });
                } else {
                    // Add regular bot message
                    newMessages.push({
                        role: "bot",
                        text: data.response || (isInitialization ? t('chatbot.greeting') : t('chatbot.somethingWentWrong')),
                        isHtml: false,
                        htmlContent: null
                    });
                }
                if (intent === 'ready_for_confirmation') {
                    newMessages.push({
                        role: "bot",
                        text: data.response || t('chatbot.confirmMessage'),
                        isHtml: false,
                        htmlContent: null
                    });

                }

                // Update session and messages
                if (data.session_id) {
                    setSessionId(data.session_id);
                }

                // Always append new messages (keep greeting message visible)
                setMessages((prev) => {
                    const updated = [...prev, ...newMessages];
                    console.log("Updated messages count:", updated.length, "Last user message index:", lastUserMessageIndex);
                    return updated;
                });

                setIsTyping(false);

                // Focus input after response
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);

                // Handle appointment confirmation
                if (intent === 'booking_confirmed' && appointmentDetails.appointment_id) {
                    if (onAppointmentCreated) {
                        onAppointmentCreated(appointmentDetails);
                    }
                    setConfirmation(true);
                    setNeedsConfirmation(false); // Reset needs confirmation after successful booking
                }
            }, 1000);


        } catch (err) {
            setTimeout(() => {
                setMessages((prev) => [...prev, {
                    role: "bot",
                    text: t('chatbot.connectionError'),
                    isHtml: false,
                    htmlContent: null
                }]);
                setIsTyping(false);

                // Focus input after error
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }, 1000);
        }
    };

    // // Initialize session when chatbotId is found from URL
    // useEffect(() => {
    //     // Only initialize if we have a chatbotId, no sessionId yet, and haven't initialized before
    //     if (chatbotId && !sessionId && !sessionInitializedRef.current && !isTyping) {
    //         sessionInitializedRef.current = true; // Mark as initializing to prevent duplicate calls
    //         console.log("Initializing session with chatbot ID:", chatbotId);
    //         // Use sendMessage function for initialization with empty message
    //         sendMessage("", true);
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [chatbotId]); // Only run when chatbotId changes

    // Fetch customer lead data from API using token
    const fetchCustomerLeadData = async (token) => {
        setIsLoadingCustomerLead(true);
        try {
            const apiUrl = `${API_BASE_URL}/api/v1/admin/customer-leads/verify/link?token=${encodeURIComponent(token)}`;
            console.log("Fetching customer lead data from:", apiUrl);

            const res = await fetch(apiUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await res.json();

            // Handle error response
            if (!res.ok || !data.success) {
                // Use error message from API response
                const errorMessage = data.error?.message || t('chatbot.tokenError') || 'Unable to load appointment details. Please try again or contact support.';
                console.error("Error fetching customer lead data:", data.error);
                setErrorDialogMessage(errorMessage);
                setShowErrorDialog(true);
                setIsLoadingCustomerLead(false);
                return;
            }

            if (data.success && data.data) {
                
                console.log("Customer lead data received:", data.data);
                // Use the id from response as searchId
                const searchId = data.data.id;
                console.log("Using searchId from response:", searchId);
                
                // Ensure chatbotId is set from the verified customer lead
                if (searchId) {
                    setChatbotId(searchId);
                }
                
                setCustomerLeadData(data.data);

                // Pre-fill appointment dialog with customer data
                const customer = data.data.customer;
                const address = data.data.address;
                const contract = data.data.contract;

                // Build full address string
                const fullAddress = [
                    address.fiscal_address
                ].filter(Boolean).join(', ');

                // Set appointment location with coordinates
                if (address.latitude && address.longitude) {
                    setAppointmentLocation({
                        lat: address.latitude,
                        lng: address.longitude,
                        address: fullAddress
                    });
                    setAppointmentSearchAddress(fullAddress);
                    setEditableHouseNumber(cleanValue(address.house_number));
                    setEditableSector(cleanValue(address.sector));
                    setEditableCity(cleanValue(address.city));
                    setEditableState(cleanValue(address.state));
                    setSavedAddressDetails({
                        houseNumber: cleanValue(address.house_number),
                        sector: cleanValue(address.sector),
                        city: cleanValue(address.city),
                        state: cleanValue(address.state)
                    });
                }

                // Pre-fill editable customer fields
                const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
                setEditableCustomerName(customerName);
                
                // Parse phone number: detect country code and keep full local number
                const { countryCode, localNumber } = detectCountryCode(customer.phone || '');
                
                // Remove all non-digits from remaining phone number (keep leading zeros)
                let phone = localNumber.replace(/\D/g, '');
                
                // Limit length (keep leading zeros if present to avoid cutting)
                if (countryCode === "+58") {
                    if (phone.length > 11) {
                        phone = phone.substring(0, 11);
                    }
                } else {
                    if (phone.length > 15) {
                        phone = phone.substring(0, 15);
                    }
                }
                
                setSelectedCountryCode(countryCode);
                setEditableCustomerPhone(phone);
                
                setEditableCustomerEmail(customer.email || '');
                
                // Only set customer requirement if it matches a dropdown option
                const installationNote = contract?.installation_notes || '';
                const matchesDropdown = customerIssues.some(issue => issue.customer_issue === installationNote);
                setEditableCustomerRequirement(matchesDropdown ? installationNote : '');

                // Set minimum date to tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const minDate = tomorrow.toISOString().split('T')[0];
                setSelectedDate(minDate);

                // Not in edit mode when opening from URL
                setIsEditMode(false);

                // Open appointment dialog
                setShowAppointmentDialog(true);
            }
        } catch (err) {
            console.error("Error fetching customer lead data:", err);
            // Show error dialog
            setErrorDialogMessage(t('chatbot.connectionError') || 'Unable to load appointment details. Please try again or contact support.');
            setShowErrorDialog(true);
        } finally {
            setIsLoadingCustomerLead(false);
        }
    };

    // Fetch customer issues from API
    const fetchCustomerIssues = async () => {
        setIsLoadingCustomerIssues(true);
        try {
            const apiUrl = `${API_BASE_URL}/api/v1/customer-issues/active`;
            console.log("Fetching customer issues from:", apiUrl);

            const res = await fetch(apiUrl, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await res.json();

            if (res.ok && data.success && Array.isArray(data.data)) {
                console.log("Customer issues received:", data.data);
                setCustomerIssues(data.data);
            } else {
                console.error("Error fetching customer issues:", data);
                // Don't show error dialog, just log it - dropdown will be empty
            }
        } catch (err) {
            console.error("Error fetching customer issues:", err);
            // Don't show error dialog, just log it - dropdown will be empty
        } finally {
            setIsLoadingCustomerIssues(false);
        }
    };

    // Fetch customer issues on mount
    useEffect(() => {
        fetchCustomerIssues();
    }, []);

    // Check for token in URL and open appointment dialog
    useEffect(() => {
        const checkAndOpenDialog = () => {
            const token = getTokenFromUrl();
            if (token) {
                console.log("Token found in URL:", token);
                // Fetch customer lead data and pre-fill dialog
                fetchCustomerLeadData(token);
            } else {
                // Don't open dialog if no token is found
                console.log("No token found in URL, opening appointment dialog");
                // Avoid reopening if already open
                if (!showAppointmentDialog) {
                    // Ensure minimum date is set
                    const minDate = getMinDate();
                    setSelectedDate(minDate);
                    setShowAppointmentDialog(true);
                }
            }
        };

        // Check on mount
        checkAndOpenDialog();

        // Also listen for URL changes
        const handleLocationChange = () => {
            setTimeout(checkAndOpenDialog, 100); // Small delay to ensure URL is updated
        };

        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('hashchange', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('hashchange', handleLocationChange);
        };
    }, []); // Run once on mount and listen for URL changes

    // Close date picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDatePicker) {
                const target = event.target;
                const datePickerElement = document.querySelector('.date-picker-container');
                const dateInputElement = document.querySelector('.date-input-wrapper');
                if (datePickerElement && !datePickerElement.contains(target) && 
                    dateInputElement && !dateInputElement.contains(target)) {
                    setShowDatePicker(false);
                }
            }
        };

        if (showDatePicker) {
            // Use capture phase so it still fires when modal containers stop propagation
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('touchstart', handleClickOutside, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('touchstart', handleClickOutside, true);
        };
    }, [showDatePicker]);

    const TypingIndicator = () => (
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl max-w-xs animate-pulse">
            <div className="w-8 h-8 bg-[#13486b] rounded-full flex items-center justify-center">
                <Bot size={16} className="text-white" />
            </div>
            <div className="flex space-x-1">
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                ></div>
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                ></div>
                <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                ></div>
            </div>
        </div>
    );

    const InfoTooltip = ({ text }) => (
        <span className="relative inline-flex items-center group align-middle">
            <Info size={14} className="text-gray-400 cursor-pointer" />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-md bg-gray-900 text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50 text-left">
                {text}
            </span>
        </span>
    );

    const startNewConversation = () => {
        setMessages([{ role: "bot", text: t('chatbot.greeting'), isHtml: false, htmlContent: null }]);
        setSessionId('');
        setInput('');
        setConfirmation(false);
        setCurrentAppointmentDetails(null);
        setLastUserMessageIndex(-1);
        setNeedsConfirmation(false);
        setShowMapDialog(false);
        setSelectedLocation({ lat: null, lng: null, address: '' });
        sessionInitializedRef.current = false; // Reset so session can be re-initialized if chatbotId exists
        
        // Reset editable fields for fresh appointment
        setEditableCustomerName("");
        setEditableCustomerPhone("");
        setSelectedCountryCode("+58"); // Reset to default Venezuela
        setEditableCustomerEmail("");
        setEditableCustomerRequirement("");
        setEditableHouseNumber("");
        setEditableSector("");
        setEditableCity("");
        setEditableState("");
        setIsEditMode(false);
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        setSelectedDate(minDate);
        
        // Open appointment dialog
        setShowAppointmentDialog(true);
    };

    const toggleLanguage = () => {
        console.log("Toggling language to:", language === 'en' ? 'es' : 'en');
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    // Get the index of the last user message
    const getLastUserMessageIndex = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                return i;
            }
        }
        return -1;
    };

    // Check if address details are missing
    const isAddressMissing = (appointmentDetails) => {
        if (!appointmentDetails) {
            console.log("Address missing: no appointmentDetails");
            return true;
        }

        // If customer object doesn't exist, address is missing
        if (!appointmentDetails.customer) {
            console.log("Address missing: no customer object", appointmentDetails);
            return true;
        }

        const customer = appointmentDetails.customer;
        // Address is missing if address is empty/null OR latitude/longitude are null/undefined
        const hasAddress = customer.address && customer.address.trim() !== '';
        const hasLat = customer.latitude !== null && customer.latitude !== undefined;
        const hasLng = customer.longitude !== null && customer.longitude !== undefined;
        const missing = !hasAddress || !hasLat || !hasLng;

        console.log("Address missing check:", missing, {
            hasAddress,
            hasLat,
            hasLng,
            address: customer.address,
            lat: customer.latitude,
            lng: customer.longitude
        });

        return missing;
    };

    // Check if address exists (for showing Edit vs Add button)
    const hasAddress = (appointmentDetails) => {
        if (!appointmentDetails || !appointmentDetails.customer) return false;
        return appointmentDetails.customer.address && appointmentDetails.customer.address.trim() !== '';
    };

    // Handle address button click - open map dialog
    const handleAddressButtonClick = () => {
        setShowMapDialog(true);
        // Initialize with existing address if available
        if (currentAppointmentDetails?.customer) {
            const customer = currentAppointmentDetails.customer;
            // If address exists, set it (even if coordinates are missing)
            if (customer.address && customer.address.trim() !== '') {
                setSelectedLocation({
                    lat: customer.latitude || null,
                    lng: customer.longitude || null,
                    address: customer.address
                });
                // Pre-fill search input with existing address
                setSearchAddress(customer.address);
            } else if (customer.latitude && customer.longitude) {
                // If only coordinates exist without address, set coordinates
                setSelectedLocation({
                    lat: customer.latitude,
                    lng: customer.longitude,
                    address: ''
                });
            }
        }
    };

    // Initialize Mapbox map
    useEffect(() => {
        if (showMapDialog && mapContainerRef.current && !mapRef.current) {
            // Set Mapbox access token from environment variable
            // Add VITE_MAPBOX_TOKEN to your .env file
            const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
            if (!mapboxToken) {
                console.error('Mapbox token not found! Please add VITE_MAPBOX_TOKEN to your .env file');
                alert('Mapbox token is required. Please configure VITE_MAPBOX_TOKEN in your environment variables.');
                setShowMapDialog(false);
                return;
            }
            mapboxgl.accessToken = mapboxToken;

            // Determine initial center and zoom
            let initialCenter = [-68.0113295, 10.2144164]; // Default to Venezuela center [lng, lat]
            let initialZoom = 10;

            if (selectedLocation.lat && selectedLocation.lng) {
                initialCenter = [selectedLocation.lng, selectedLocation.lat];
                initialZoom = 15;
            } else if (currentAppointmentDetails?.customer?.latitude && currentAppointmentDetails?.customer?.longitude) {
                initialCenter = [currentAppointmentDetails.customer.longitude, currentAppointmentDetails.customer.latitude];
                initialZoom = 15;
            }

            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: initialCenter,
                attributionControl: false,
                zoom: initialZoom,
                scrollZoom: true,
                dragPan: true,
                cooperativeGestures: true
            });

            mapRef.current = map;
            map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

            // Wait for map to load before adding marker
            map.on('load', async () => {
                // Determine coordinates for marker
                let markerLat = selectedLocation.lat;
                let markerLng = selectedLocation.lng;

                if (!markerLat || !markerLng) {
                    if (currentAppointmentDetails?.customer?.latitude && currentAppointmentDetails?.customer?.longitude) {
                        markerLat = currentAppointmentDetails.customer.latitude;
                        markerLng = currentAppointmentDetails.customer.longitude;
                    }
                }

                // If we have address but no coordinates, search for the address
                if ((!markerLat || !markerLng) && selectedLocation.address && selectedLocation.address.trim() !== '') {
                    try {
                        // Auto-search for the address to get coordinates
                        const response = await fetch(
                            `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(selectedLocation.address)}&access_token=${mapboxgl.accessToken}&language=es&limit=1`
                        );
                        const data = await response.json();

                        if (data.features && data.features.length > 0) {
                            const feature = data.features[0];
                            const coordinates = feature.geometry?.coordinates || feature.coordinates || feature.center;
                            const [lng, lat] = coordinates;
                            const address = feature.properties?.full_address || feature.properties?.place_name || selectedLocation.address;

                            markerLat = lat;
                            markerLng = lng;

                            // Update selected location with found coordinates
                            setSelectedLocation({ lat, lng, address });

                            // Focus map on the found location
                            map.flyTo({
                                center: [lng, lat],
                                zoom: 15,
                                duration: 1000
                            });
                        }
                    } catch (error) {
                        console.error('Auto-search address error:', error);
                        // Continue without coordinates - user can search manually
                    }
                }

                // Add marker if we have coordinates
                if (markerLat && markerLng) {
                    markerRef.current = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([markerLng, markerLat])
                        .addTo(map);

                    markerRef.current.on('dragend', () => {
                        const lngLat = markerRef.current.getLngLat();
                        reverseGeocode(lngLat.lat, lngLat.lng);
                    });

                    // Set initial selected location if not already set
                    if (!selectedLocation.address && currentAppointmentDetails?.customer?.address) {
                        setSelectedLocation({
                            lat: markerLat,
                            lng: markerLng,
                            address: currentAppointmentDetails.customer.address
                        });
                    }
                }
            });

            // Handle map click
            map.on('click', (e) => {
                const { lng, lat } = e.lngLat;
                reverseGeocode(lat, lng);

                // Update or create marker
                if (markerRef.current) {
                    markerRef.current.setLngLat([lng, lat]);
                } else {
                    markerRef.current = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    markerRef.current.on('dragend', () => {
                        const lngLat = markerRef.current.getLngLat();
                        reverseGeocode(lngLat.lat, lngLat.lng);
                    });
                }
            });

            // Cleanup on unmount
            return () => {
                if (mapRef.current) {
                    mapRef.current.remove();
                    mapRef.current = null;
                }
            };
        }
    }, [showMapDialog, selectedLocation]);

    // Ensure the map resizes and remains interactive when the dialog toggles
    useEffect(() => {
        if (showMapDialog && mapRef.current) {
            setTimeout(() => {
                mapRef.current?.resize();
                mapRef.current?.scrollZoom.enable();
                mapRef.current?.dragPan.enable();
            }, 50);
        }
    }, [showMapDialog]);

    // Update marker and focus map when selectedLocation changes and map exists
    useEffect(() => {
        if (showMapDialog && mapRef.current && selectedLocation.lat && selectedLocation.lng) {
            const lat = Number(selectedLocation.lat);
            const lng = Number(selectedLocation.lng);

            // Focus map on the location
            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 15,
                duration: 1000
            });

            // Update or create marker
            if (markerRef.current) {
                markerRef.current.setLngLat([lng, lat]);
            } else {
                markerRef.current = new mapboxgl.Marker({ draggable: true })
                    .setLngLat([lng, lat])
                    .addTo(mapRef.current);

                markerRef.current.on('dragend', () => {
                    const lngLat = markerRef.current.getLngLat();
                    reverseGeocode(lngLat.lat, lngLat.lng);
                });
            }
            // Ensure map is interactive after updates
            mapRef.current.scrollZoom.enable();
            mapRef.current.dragPan.enable();
            mapRef.current.resize();
        }
    }, [selectedLocation, showMapDialog]);

    // Initialize appointment map
    useEffect(() => {
        const { lat: apptLat, lng: apptLng } = appointmentLocation;

        if (showAppointmentDialog && appointmentMapContainerRef.current && !appointmentMapRef.current) {
            const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
            if (!mapboxToken) {
                console.error('Mapbox token not found! Please add VITE_MAPBOX_TOKEN to your .env file');
                alert('Mapbox token is required. Please configure VITE_MAPBOX_TOKEN in your environment variables.');
                setShowAppointmentDialog(false);
                return;
            }
            mapboxgl.accessToken = mapboxToken;

            let initialCenter = [-68.0113295, 10.2144164]; // Default to Venezuela center [lng, lat]
            let initialZoom = 10;

            // Use coordinates from appointmentLocation or customerLeadData
            let lat = apptLat;
            let lng = apptLng;

            if (!lat || !lng) {
                // Try to get from customerLeadData
                if (customerLeadData?.address?.latitude && customerLeadData?.address?.longitude) {
                    lat = customerLeadData.address.latitude;
                    lng = customerLeadData.address.longitude;
                }
            }

            if (lat && lng) {
                initialCenter = [lng, lat];
                initialZoom = 15;
            }

            const map = new mapboxgl.Map({
                container: appointmentMapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: initialCenter,
                attributionControl: false,
                zoom: initialZoom,
                scrollZoom: true,
                dragPan: true,
                cooperativeGestures: true
            });

            appointmentMapRef.current = map;
            map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

            map.on('load', () => {
                // Get coordinates from appointmentLocation or customerLeadData
                let markerLat = appointmentLocation.lat;
                let markerLng = appointmentLocation.lng;

                if (!markerLat || !markerLng) {
                    if (customerLeadData?.address?.latitude && customerLeadData?.address?.longitude) {
                        markerLat = customerLeadData.address.latitude;
                        markerLng = customerLeadData.address.longitude;
                    }
                }

                if (markerLat && markerLng) {
                    appointmentMarkerRef.current = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([markerLng, markerLat])
                        .addTo(map);

                    appointmentMarkerRef.current.on('dragend', () => {
                        const lngLat = appointmentMarkerRef.current.getLngLat();
                        reverseGeocodeAppointment(lngLat.lat, lngLat.lng);
                    });
                }
            });

            map.on('click', (e) => {
                const { lng, lat } = e.lngLat;
                reverseGeocodeAppointment(lat, lng);

                if (appointmentMarkerRef.current) {
                    appointmentMarkerRef.current.setLngLat([lng, lat]);
                } else {
                    appointmentMarkerRef.current = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    appointmentMarkerRef.current.on('dragend', () => {
                        const lngLat = appointmentMarkerRef.current.getLngLat();
                        reverseGeocodeAppointment(lngLat.lat, lngLat.lng);
                    });
                }
            });

            return () => {
                if (appointmentMapRef.current) {
                    appointmentMapRef.current.remove();
                    appointmentMapRef.current = null;
                }
            };
        }
    }, [showAppointmentDialog, appointmentLocation.lat, appointmentLocation.lng, customerLeadData]);

    // Ensure appointment map resizes and stays interactive when dialog toggles
    useEffect(() => {
        if (showAppointmentDialog && appointmentMapRef.current) {
            setTimeout(() => {
                appointmentMapRef.current?.resize();
                appointmentMapRef.current?.scrollZoom.enable();
                appointmentMapRef.current?.dragPan.enable();
            }, 50);
        }
    }, [showAppointmentDialog]);

    // Update appointment marker when location changes
    useEffect(() => {
        const { lat: apptLat, lng: apptLng } = appointmentLocation;

        if (showAppointmentDialog && appointmentMapRef.current) {
            // Get coordinates from appointmentLocation or customerLeadData
            let lat = apptLat;
            let lng = apptLng;

            if (!lat || !lng) {
                if (customerLeadData?.address?.latitude && customerLeadData?.address?.longitude) {
                    lat = customerLeadData.address.latitude;
                    lng = customerLeadData.address.longitude;
                }
            }

            if (lat && lng) {
                const latNum = Number(lat);
                const lngNum = Number(lng);

                appointmentMapRef.current.flyTo({
                    center: [lngNum, latNum],
                    zoom: 15,
                    duration: 1000
                });

                if (appointmentMarkerRef.current) {
                    appointmentMarkerRef.current.setLngLat([lngNum, latNum]);
                } else {
                    appointmentMarkerRef.current = new mapboxgl.Marker({ draggable: true })
                        .setLngLat([lngNum, latNum])
                        .addTo(appointmentMapRef.current);

                    appointmentMarkerRef.current.on('dragend', () => {
                        const lngLat = appointmentMarkerRef.current.getLngLat();
                        reverseGeocodeAppointment(lngLat.lat, lngLat.lng);
                    });
                }

                // Ensure map remains interactive
                appointmentMapRef.current.scrollZoom.enable();
                appointmentMapRef.current.dragPan.enable();
                appointmentMapRef.current.resize();
            }
        }
    }, [appointmentLocation.lat, appointmentLocation.lng, showAppointmentDialog, customerLeadData]);

    // Reverse geocode coordinates to get address
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&types=place,locality,neighborhood,address&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                // v6 API response structure - use place_name or full_address
                const feature = data.features[0];
                const address = feature.properties?.full_address || feature.properties?.place_name || feature.place_name || `${lat}, ${lng}`;
                setSelectedLocation({ lat, lng, address });
                setSearchAddress(address); // sync input with reverse geocoded address
                const { city, state } = extractCityState(feature);
                if (city) setEditableCity(city);
                if (state) setEditableState(state);
            } else {
                setSelectedLocation({ lat, lng, address: `${lat}, ${lng}` });
                setSearchAddress(`${lat}, ${lng}`);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setSelectedLocation({ lat, lng, address: `${lat}, ${lng}` });
            setSearchAddress(`${lat}, ${lng}`);
        }
    };

    // Search for address using Mapbox Geocoding API
    const handleSearchAddress = async () => {
        if (!searchAddress.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchAddress)}&access_token=${mapboxgl.accessToken}&language=${language}&limit=1`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                // v6 API response structure - coordinates are in geometry.coordinates [lng, lat]
                const coordinates = feature.geometry?.coordinates || feature.coordinates || feature.center;
                const [lng, lat] = coordinates;
                // v6 API - use full_address or place_name from properties
                const address = feature.properties?.full_address || feature.properties?.place_name || feature.place_name || searchAddress;
                // Extract city/state from the feature and set fields
                const { city, state } = extractCityState(feature);
                if (city) setEditableCity(city);
                if (state) setEditableState(state);

                // Update map center and add marker
                if (mapRef.current) {
                    mapRef.current.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        duration: 1000
                    });

                    // Update or create marker
                    if (markerRef.current) {
                        markerRef.current.setLngLat([lng, lat]);
                    } else {
                        markerRef.current = new mapboxgl.Marker({ draggable: true })
                            .setLngLat([lng, lat])
                            .addTo(mapRef.current);

                        markerRef.current.on('dragend', () => {
                            const lngLat = markerRef.current.getLngLat();
                            reverseGeocode(lngLat.lat, lngLat.lng);
                        });
                    }

                    // Set selected location
                    setSelectedLocation({ lat, lng, address });
                }
            } else {
                alert(t('chatbot.addressNotFound'));
            }
        } catch (error) {
            console.error('Address search error:', error);
            alert(t('chatbot.addressSearchError'));
        } finally {
            setIsSearching(false);
        }
    };

    // Submit address from map
    const submitAddressFromMap = async () => {
        if (!selectedLocation.lat || !selectedLocation.lng) {
            alert(t('chatbot.selectLocationAlert'));
            return;
        }

        setShowMapDialog(false);

        // Send address with coordinates as a message to the chatbot
        // Pass isAddressUpdate=true to bypass validation and allow the message to be sent
        const addressMessage = `${t('chatbot.myAddressIs')} ${selectedLocation.address}. ${t('chatbot.coordinates')} ${selectedLocation.lat}, ${selectedLocation.lng}`;
        await sendMessage(addressMessage, false, true);

        // Cleanup map
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }

        setSelectedLocation({ lat: null, lng: null, address: '' });
    };

    // Close map dialog
    const closeMapDialog = () => {
        setShowMapDialog(false);
        setSearchAddress("");
        // Cleanup map
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
        if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
        setSelectedLocation({ lat: null, lng: null, address: '' });
    };


    // Check if date is in the future (tomorrow onwards, not today)
    const isFutureDate = (dateString) => {
        if (!dateString) return false;
        const selected = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        // Only allow dates strictly after today (tomorrow onwards)
        return selected > today;
    };

    // Check if date and time is in the future
    const isFutureDateTime = (dateString, timeString) => {
        if (!dateString || !timeString) return false;

        const selectedDate = new Date(dateString);
        const [hours, minutes] = timeString.split(':').map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);

        const now = new Date();

        return selectedDate > now;
    };

    // Get minimum date (tomorrow) in local timezone
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // Add one day
        const year = tomorrow.getFullYear();
        const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
        const day = tomorrow.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format date to DD/MM/YYYY
    const formatDateDDMMYYYY = (dateString) => {
        if (!dateString) return '';
        // Parse YYYY-MM-DD format and create date in local timezone
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const formattedDay = date.getDate().toString().padStart(2, '0');
        const formattedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const formattedYear = date.getFullYear();
        return `${formattedDay}/${formattedMonth}/${formattedYear}`;
    };

    // Parse DD/MM/YYYY to YYYY-MM-DD
    const parseDateDDMMYYYY = (dateString) => {
        if (!dateString) return '';
        const parts = dateString.split('/');
        if (parts.length !== 3) return '';
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    };

    // Get days in month
    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    // Handle date selection from calendar
    const handleDateSelect = (day) => {
        const selected = new Date(calendarYear, calendarMonth, day);
        // Format as YYYY-MM-DD in local timezone
        const year = selected.getFullYear();
        const month = (selected.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = selected.getDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${dayStr}`;
        
        // Only allow future dates (tomorrow onwards)
        if (isFutureDate(dateString)) {
            setSelectedDate(dateString);
            setShowDatePicker(false);
            if (isEditMode) {
                setTimeout(() => validateEditModeFields(), 0);
            }
        }
    };

    // Navigate calendar months
    const navigateMonth = (direction) => {
        if (direction === 'prev') {
            if (calendarMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(calendarYear - 1);
            } else {
                setCalendarMonth(calendarMonth - 1);
            }
        } else {
            if (calendarMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(calendarYear + 1);
            } else {
                setCalendarMonth(calendarMonth + 1);
            }
        }
    };

    // Convert 12-hour format to 24-hour format (HH:MM)
    const convert12To24Hour = (hour12, minute, ampm) => {
        if (!hour12 || !minute) return '';

        let hour24 = parseInt(hour12, 10);
        if (ampm === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
            hour24 = 0;
        }

        return `${hour24.toString().padStart(2, '0')}:${minute}`;
    };

    // Check if time is within allowed range (9 AM to 6 PM)
    const isTimeInAllowedRange = (hour, minute, ampm) => {
        if (!hour || !minute) return false;
        const time24 = convert12To24Hour(hour, minute, ampm);
        if (!time24) return false;
        const [hours, minutes] = time24.split(':').map(Number);
        // Allow 9:00 AM (09:00) to 6:00 PM (18:00)
        const totalMinutes = hours * 60 + minutes;
        const minMinutes = 9 * 60; // 9:00 AM
        const maxMinutes = 18 * 60; // 6:00 PM
        return totalMinutes >= minMinutes && totalMinutes <= maxMinutes;
    };

    // Update selectedTime from 12-hour format inputs
    const updateTimeFrom12Hour = (hour, minute, ampm) => {
        if (!hour || !minute) {
            setSelectedTime("");
            setTimeError("");
            return;
        }
        
        const time24 = convert12To24Hour(hour, minute, ampm);
        setSelectedTime(time24);
        
        // Validate time range (9 AM to 6 PM)
        if (!isTimeInAllowedRange(hour, minute, ampm)) {
            setTimeError(t('chatbot.timeRangeError') || 'Time must be between 9 AM and 6 PM');
        } else {
            setTimeError("");
        }
    };

    // Handle phone number input with validation
    const handlePhoneNumberChange = (value) => {
        // Remove all non-digit characters (keep only digits)
        let digitsOnly = value.replace(/\D/g, '');
        
        if (selectedCountryCode === "+58") {
            // For Venezuela, keep leading 0 if user types it; allow up to 11 digits
            if (digitsOnly.length > 11) {
                digitsOnly = digitsOnly.substring(0, 11);
            }
        } else {
            // For other countries, allow up to 15 digits (international standard)
            if (digitsOnly.length > 15) {
                digitsOnly = digitsOnly.substring(0, 15);
            }
        }
        
        setEditableCustomerPhone(digitsOnly);
    };

    // Get phone number with country code
    const getFullPhoneNumber = () => {
        if (!editableCustomerPhone.trim()) return '';
        return `${selectedCountryCode}${editableCustomerPhone}`;
    };

    // Validate phone number based on country code
    const isValidPhoneNumber = (phone, countryCode) => {
        if (!phone || !phone.trim()) return false;
        
        const digitsOnly = phone.replace(/\D/g, '');
        
        // Venezuela: allow 10 or 11 digits (to avoid cutting leading 0 when present)
        if (countryCode === "+58") {
            return digitsOnly.length >= 10 && digitsOnly.length <= 11;
        }
        
        // Other countries: 7-15 digits (international standard)
        return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    };

    // Validate email format
    const isValidEmail = (email) => {
        if (!email || email.trim() === '') return true; // Empty email is valid (optional field)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    // Validate all fields in edit mode - all fields are mandatory
    const validateEditModeFields = () => {
        const errors = {
            name: "",
            phone: "",
            email: "",
            requirement: "",
            date: "",
            time: "",
            address: ""
        };

        if (isEditMode) {
            // All fields are mandatory in edit mode
            if (!editableCustomerName.trim()) {
                errors.name = t('chatbot.fieldRequired') || 'This field is required';
            }
            
            if (!editableCustomerPhone.trim()) {
                errors.phone = t('chatbot.fieldRequired') || 'This field is required';
            } else if (!isValidPhoneNumber(editableCustomerPhone, selectedCountryCode)) {
                if (selectedCountryCode === "+58") {
                    errors.phone = t('chatbot.phoneValidationError') || 'Phone number must be exactly 10 digits';
                } else {
                    errors.phone = t('chatbot.phoneValidationErrorInternational') || 'Phone number must be between 7 and 15 digits';
                }
            }
            
            if (!editableCustomerEmail.trim()) {
                errors.email = t('chatbot.fieldRequired') || 'This field is required';
            } else if (!isValidEmail(editableCustomerEmail)) {
                errors.email = t('chatbot.emailValidationError') || 'Please enter a valid email address';
            }
            
            if (!editableCustomerRequirement.trim()) {
                errors.requirement = t('chatbot.fieldRequired') || 'This field is required';
            }
            
            if (!selectedDate) {
                errors.date = t('chatbot.fieldRequired') || 'This field is required';
            } else if (!isFutureDate(selectedDate)) {
                errors.date = t('chatbot.pleaseSelectFutureDate');
            }
            
            if (!selectedTime && (!selectedHour || !selectedMinute)) {
                errors.time = t('chatbot.fieldRequired') || 'This field is required';
            } else if (selectedHour && selectedMinute && !isTimeInAllowedRange(selectedHour, selectedMinute, selectedAmPm)) {
                errors.time = t('chatbot.timeRangeError') || 'Time must be between 9 AM and 6 PM';
            }
            
            if (!appointmentLocation.lat || !appointmentLocation.lng) {
                errors.address = t('chatbot.fieldRequired') || 'This field is required';
            }
        }

        setFieldErrors(errors);
        return Object.values(errors).every(error => error === "");
    };

    // Check viability of address using API
    const checkAddressViability = async (lat, lng) => {
        setIsCheckingViability(true);
        setViabilityError("");
        
        try {
            const apiUrl = `${API_BASE_URL}/api/v1/admin/customer-leads/check-viability?lat=${lat}&lng=${lng}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const responseData = await response.json();
            
            // Handle nested response: { success: true, data: { success, isInstallable, detail, distance } }
            const viabilityData = responseData.data || responseData;
            
            if (responseData.success && viabilityData.isInstallable) {
                setViabilityError("");
                return true;
            } else {
                const errorMessage = viabilityData.detail || t('chatbot.addressNotInstallable') || 'This address is not available for installation service.';
                setViabilityError(errorMessage);
                return false;
            }
        } catch (error) {
            console.error('Viability check error:', error);
            setViabilityError(t('chatbot.viabilityCheckError') || 'Unable to verify address availability. Please try again.');
            return false;
        } finally {
            setIsCheckingViability(false);
        }
    };

    // Reverse geocode for appointment dialog
    const reverseGeocodeAppointment = async (lat, lng) => {
        try {
            // First: Reverse geocode to get address
            const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&types=place,locality,neighborhood,address&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();

            let address = `${lat}, ${lng}`;
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                address = feature.properties?.full_address || feature.properties?.place_name || feature.place_name || `${lat}, ${lng}`;
                
                // Update address fields temporarily
                setAppointmentSearchAddress(address);
                setEditableFullAddress(address);
                
                const { city, state } = extractCityState(feature);
                if (city) setEditableCity(city);
                if (state) setEditableState(state);
            } else {
                setAppointmentSearchAddress(address);
                setEditableFullAddress(address);
            }
            
            // Second: Check viability API
            const isViable = await checkAddressViability(lat, lng);
            
            if (!isViable) {
                // Clear location coordinates if not viable (marker stays to show clicked location)
                setAppointmentLocation({ lat: null, lng: null, address: '' });
                setEditableFullAddress('');
                return;
            }
            
            // If viable, update appointment location with coordinates
            setAppointmentLocation({ lat, lng, address });
            
            if (isEditMode) {
                setTimeout(() => validateEditModeFields(), 0);
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setAppointmentSearchAddress(`${lat}, ${lng}`);
            setEditableFullAddress(`${lat}, ${lng}`);
            
            // Still check viability even if geocoding failed
            const isViable = await checkAddressViability(lat, lng);
            
            if (!isViable) {
                setAppointmentLocation({ lat: null, lng: null, address: '' });
                setEditableFullAddress('');
                return;
            }
            
            setAppointmentLocation({ lat, lng, address: `${lat}, ${lng}` });
            
            if (isEditMode) {
                setTimeout(() => validateEditModeFields(), 0);
            }
        }
    };

    // Search address for appointment dialog
    const handleAppointmentSearchAddress = async () => {
        if (!appointmentSearchAddress.trim()) return;

        setIsAppointmentSearching(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(appointmentSearchAddress)}&access_token=${mapboxgl.accessToken}&language=${language}&limit=1`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const coordinates = feature.geometry?.coordinates || feature.coordinates || feature.center;
                const [lng, lat] = coordinates;
                const address = feature.properties?.full_address || feature.properties?.place_name || feature.place_name || appointmentSearchAddress;
                // Extract city/state from the feature and set fields
                const { city, state } = extractCityState(feature);
                if (city) setEditableCity(city);
                if (state) setEditableState(state);

                if (appointmentMapRef.current) {
                    appointmentMapRef.current.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        duration: 1000
                    });

                    if (appointmentMarkerRef.current) {
                        appointmentMarkerRef.current.setLngLat([lng, lat]);
                    } else {
                        appointmentMarkerRef.current = new mapboxgl.Marker({ draggable: true })
                            .setLngLat([lng, lat])
                            .addTo(appointmentMapRef.current);

                        appointmentMarkerRef.current.on('dragend', () => {
                            const lngLat = appointmentMarkerRef.current.getLngLat();
                            reverseGeocodeAppointment(lngLat.lat, lngLat.lng);
                        });
                    }

                    setAppointmentLocation({ lat, lng, address });
                    if (isEditMode) {
                        setTimeout(() => validateEditModeFields(), 0);
                    }
                }
            } else {
                alert(t('chatbot.addressNotFound'));
            }
        } catch (error) {
            console.error('Address search error:', error);
            alert(t('chatbot.addressSearchError'));
        } finally {
            setIsAppointmentSearching(false);
        }
    };

    // Handle SearchBox retrieve event for appointment dialog
    const handleSearchBoxRetrieve = async (result) => {
        if (result && result.features && result.features.length > 0) {

            console.log(result);
            const feature = result.features[0];
            const coordinates = feature.geometry?.coordinates;
            if (coordinates) {
                const [lng, lat] = coordinates;
                const address = feature.properties?.full_address || feature.properties?.place_name || feature.place_name || '';
                
                // First: Update map, fly to location and set marker
                if (appointmentMapRef.current) {
                    appointmentMapRef.current.flyTo({
                        center: [lng, lat],
                        zoom: 15,
                        duration: 1000
                    });

                    if (appointmentMarkerRef.current) {
                        appointmentMarkerRef.current.setLngLat([lng, lat]);
                    } else {
                        appointmentMarkerRef.current = new mapboxgl.Marker({ draggable: true })
                            .setLngLat([lng, lat])
                            .addTo(appointmentMapRef.current);

                        appointmentMarkerRef.current.on('dragend', () => {
                            const lngLat = appointmentMarkerRef.current.getLngLat();
                            reverseGeocodeAppointment(lngLat.lat, lngLat.lng);
                        });
                    }
                }
                
                // Second: Update address fields temporarily
                setAppointmentSearchAddress(address);
                setEditableFullAddress(address);
                
                // Extract city and state
                const { city, state } = extractCityState(feature);
                if (city) setEditableCity(city);
                if (state) setEditableState(state);
                
                // Third: Check viability API
                const isViable = await checkAddressViability(lat, lng);
                
                if (!isViable) {
                    // Clear location coordinates if not viable (keep marker visible to show searched location)
                    setAppointmentLocation({ lat: null, lng: null, address: '' });
                    setEditableFullAddress('');
                    return;
                }
                
                // If viable, update appointment location with coordinates
                setAppointmentLocation({ lat, lng, address });

                if (isEditMode) {
                    setTimeout(() => validateEditModeFields(), 0);
                }
            }
        }
    };

    // Submit appointment booking
    const submitAppointmentBooking = async () => {
        // Validate all fields in edit mode first
        if (isEditMode && !validateEditModeFields()) {
            // Find first error and show alert
            const firstError = Object.entries(fieldErrors).find(([key, value]) => value !== "");
            if (firstError) {
                alert(firstError[1]);
            } else {
                alert(t('chatbot.fieldRequired') || 'Please fill in all required fields');
            }
            return;
        }

        // Validate customer requirement (mandatory field)
        if (!editableCustomerRequirement.trim()) {
            setFieldErrors(prev => ({ ...prev, requirement: t('chatbot.fieldRequired') || 'This field is required' }));
            alert(t('chatbot.fieldRequired') || 'Please select a customer requirement');
            return;
        }

        if (!selectedDate || !isFutureDate(selectedDate)) {
            alert(t('chatbot.pleaseSelectFutureDate'));
            return;
        }
        if (!selectedTime && (!selectedHour || !selectedMinute)) {
            alert(t('chatbot.pleaseSelectTimeSlot'));
            return;
        }

        // Validate that date and time is not in the past
        const timeToValidate = selectedTime || convert12To24Hour(selectedHour, selectedMinute, selectedAmPm);
        if (timeToValidate && !isFutureDateTime(selectedDate, timeToValidate)) {
            alert(t('chatbot.pastDateTimeNotAllowed') || 'Past date and time are not allowed. Please select a future date and time.');
            return;
        }

        // Validate time range (9 AM to 6 PM)
        if (selectedHour && selectedMinute) {
            if (!isTimeInAllowedRange(selectedHour, selectedMinute, selectedAmPm)) {
                alert(t('chatbot.timeRangeError') || 'Time must be between 9 AM and 6 PM');
                return;
            }
        } else if (selectedTime) {
            // Check if time is within 9 AM to 6 PM range
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            const minMinutes = 9 * 60; // 9:00 AM
            const maxMinutes = 18 * 60; // 6:00 PM
            if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
                alert(t('chatbot.timeRangeError') || 'Time must be between 9 AM and 6 PM');
                return;
            }
        }

        if (!appointmentLocation.lat || !appointmentLocation.lng) {
            alert(t('chatbot.pleaseSelectAddressOnMap'));
            return;
        }

        // Validate email if provided
        if (editableCustomerEmail.trim() && !isValidEmail(editableCustomerEmail)) {
            alert(t('chatbot.emailValidationError') || 'Please enter a valid email address');
            return;
        }

        // Format the appointment message
        const dateObj = new Date(selectedDate);
        // Format date as DD/MM/YY
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear().toString(); // Get last 2 digits of year
        const formattedDate = `${day}/${month}/${year}`;

        // Format time from HH:MM to 12-hour format
        let timeLabel = '';
        if (selectedTime) {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            timeLabel = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        } else if (selectedHour && selectedMinute) {
            // Use 12-hour format directly if available
            timeLabel = `${selectedHour}:${selectedMinute} ${selectedAmPm}`;
        }

        // Get customer name, phone, email, and requirement from editable fields or API data
        let customerName = '';
        let customerPhone = '';
        let customerEmail = '';
        let installationNotes = '';

        // Priority: Use editable fields if filled, otherwise use API data
        if (editableCustomerName.trim()) {
            customerName = editableCustomerName.trim();
        } else if (customerLeadData) {
            const customer = customerLeadData.customer;
            customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
        }

        if (editableCustomerPhone.trim()) {
            // Use the full phone number with country code
            customerPhone = getFullPhoneNumber();
        } else if (customerLeadData) {
            let phone = customerLeadData.customer.phone || '';
            // If phone already includes country code, use it as is
            if (phone.startsWith('+')) {
                customerPhone = phone;
            } else {
                // Remove all non-digits
                phone = phone.replace(/\D/g, '');
                // Limit length based on selected country (keep leading zeros)
                if (selectedCountryCode === "+58") {
                    if (phone.length > 11) {
                        phone = phone.substring(0, 11);
                    }
                } else {
                    if (phone.length > 15) {
                        phone = phone.substring(0, 15);
                    }
                }
                // Add country code if not present
                customerPhone = `${selectedCountryCode}${phone}`;
            }
        }

        if (editableCustomerEmail.trim()) {
            customerEmail = editableCustomerEmail.trim();
        } else if (customerLeadData) {
            customerEmail = customerLeadData.customer?.email || '';
        } else if (currentAppointmentDetails?.customer?.email) {
            customerEmail = currentAppointmentDetails.customer.email;
        }

        if (editableCustomerRequirement.trim()) {
            installationNotes = editableCustomerRequirement.trim();
        } else if (customerLeadData) {
            installationNotes = customerLeadData.contract?.installation_notes || '';
        }

        // Build structured appointment message with labels and values
       
        const messageParts = [];
        
        // Only add fields if they have values
        if (customerName && customerName.trim()) {
            messageParts.push(`${t('chatbot.customerName') || 'Customer Name'}: ${customerName.trim()}`);
        }
        
        if (customerPhone && customerPhone.trim()) {
            messageParts.push(`${t('appointments.contactNumber') || 'Contact Number'}: ${customerPhone.trim()}`);
        }
        
        if (customerEmail && customerEmail.trim()) {
            messageParts.push(`${t('chatbot.customerEmail') || 'Email'}: ${customerEmail.trim()}`);
        }
        
        if (installationNotes && installationNotes.trim()) {
            messageParts.push(`${t('chatbot.customerRequirement') || 'Customer Requirements'}: ${installationNotes.trim()}`);
        }
        
        // Format address with coordinates
        const fullAddress = editableFullAddress.trim() || appointmentLocation.address || '';
        const addressWithCoordinates = fullAddress;
        const coordinates = appointmentLocation.lat && appointmentLocation.lng 
            ? ` (${t('chatbot.coordinates')} ${appointmentLocation.lat}, ${appointmentLocation.lng})`
            : '';
        messageParts.push(`${t('appointments.address') || 'Address'}: ${addressWithCoordinates}${coordinates}`);
        if (editableHouseNumber.trim()) {
           
            messageParts.push(`House Number: ${editableHouseNumber.trim()}`);
        }
        if (editableSector.trim()) {
           
            messageParts.push(`Sector: ${editableSector.trim()}`);
        }
        if (editableCity.trim()) {
            
            messageParts.push(`City: ${editableCity.trim()}`);
        }
        if (editableState.trim()) {
            
            messageParts.push(`State: ${editableState.trim()}`);
        }
        // Persist address detail fields for reuse when editing
        setSavedAddressDetails({
            houseNumber: editableHouseNumber.trim(),
            sector: editableSector.trim(),
            city: editableCity.trim(),
            state: editableState.trim()
        });
        
        messageParts.push(`${t('appointments.date') || 'Date'}: ${formattedDate} (DD/MM/YYYY)`);
        messageParts.push(`${t('appointments.time') || 'Time'}: ${timeLabel}`);
        
        const appointmentMessage = messageParts.join('\n');

        // Close dialog
        setShowAppointmentDialog(false);


        // Cleanup appointment map
        if (appointmentMapRef.current) {
            appointmentMapRef.current.remove();
            appointmentMapRef.current = null;
        }
        if (appointmentMarkerRef.current) {
            appointmentMarkerRef.current.remove();
            appointmentMarkerRef.current = null;
        }
        setIsOpen(true);
        // Send message to chatbot
        await sendMessage(appointmentMessage, false, false);

        // Reset appointment form
        setSelectedDate("");
        setSelectedTime("");
        setSelectedHour("");
        setSelectedMinute("");
        setSelectedAmPm("AM");
        setTimeError("");
        setAppointmentLocation({ lat: null, lng: null, address: '' });
        setAppointmentSearchAddress("");
        setEditableFullAddress("");
        setViabilityError("");
        setEditableCustomerName("");
        setEditableCustomerPhone("");
        setSelectedCountryCode("+58"); // Reset to default Venezuela
        setEditableCustomerEmail("");
        setEditableCustomerRequirement("");
        setSavedAddressDetails({
            houseNumber: "",
            sector: "",
            city: "",
            state: ""
        });

    };

    // Open appointment dialog with pre-filled data from current appointment details
    const openEditAppointmentDialog = () => {
        if (!currentAppointmentDetails) return;

        const customer = currentAppointmentDetails.customer;
        const service = currentAppointmentDetails.service;

        // Pre-fill date
        if (service?.date) {
            // Convert date format from DD/MM/YYYY to YYYY-MM-DD
            const dateParts = service.date.split('/');
            if (dateParts.length === 3) {
                const day = dateParts[0].padStart(2, '0');
                const month = dateParts[1].padStart(2, '0');
                const year = dateParts[2];
                const formattedDate = `${year}-${month}-${day}`;
                setSelectedDate(formattedDate);
            } else {
                // Try parsing as ISO date or other formats
                try {
                    const dateObj = new Date(service.date);
                    if (!isNaN(dateObj.getTime())) {
                        setSelectedDate(dateObj.toISOString().split('T')[0]);
                    }
                } catch (e) {
                    console.error('Error parsing date:', e);
                }
            }
        }

        // Pre-fill time
        if (service?.time) {
            // Parse time from format like "1:16 PM"
            const timeMatch = service.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1], 10);
                const minute = timeMatch[2];
                const ampm = timeMatch[3].toUpperCase();

                setSelectedHour(hour.toString().padStart(2, '0'));
                setSelectedMinute(minute);
                setSelectedAmPm(ampm);

                // Convert to 24-hour format for selectedTime
                let hour24 = hour;
                if (ampm === 'PM' && hour !== 12) {
                    hour24 = hour + 12;
                } else if (ampm === 'AM' && hour === 12) {
                    hour24 = 0;
                }
                setSelectedTime(`${hour24.toString().padStart(2, '0')}:${minute}`);
            }
        }

        // Pre-fill address
        if (customer?.address) {
            setAppointmentSearchAddress(customer.address);
            setAppointmentLocation({
                lat: customer.latitude || null,
                lng: customer.longitude || null,
                address: customer.address
            });

        }
       

        // Store customer data for pre-filling in the booking message
        if (customer) {
            setCustomerLeadData({
                customer: {
                    first_name: customer.name?.split(' ')[0] || '',
                    last_name: customer.name?.split(' ').slice(1).join(' ') || '',
                    phone: customer.contact_number || '',
                    email: customer.email || ''
                },
                contract: {
                    installation_notes: service?.customer_requirement || ''
                },
                address: {
                    fiscal_address: customer.address || '',
                    latitude: customer.latitude || null,
                    longitude: customer.longitude || null
                }
            });
            
            // Pre-fill editable fields
            setEditableCustomerName(customer.name || '');
            
            // Parse phone number: detect country code and keep full local number
            const { countryCode, localNumber } = detectCountryCode(customer.contact_number || '');
            
            // Remove all non-digits from remaining phone number (keep leading zeros)
            let phone = localNumber.replace(/\D/g, '');
            
            // Limit length (keep leading zeros if present to avoid cutting)
            if (countryCode === "+58") {
                if (phone.length > 11) {
                    phone = phone.substring(0, 11);
                }
            } else {
                if (phone.length > 15) {
                    phone = phone.substring(0, 15);
                }
            }
            
            setSelectedCountryCode(countryCode);
            setEditableCustomerPhone(phone);
            
            setEditableCustomerEmail(customer.email || '');
            
            // Only set customer requirement if it matches a dropdown option
            const customerRequirement = service?.customer_requirement || '';
            const matchesDropdown = customerIssues.some(issue => issue.customer_issue === customerRequirement);
            setEditableCustomerRequirement(matchesDropdown ? customerRequirement : '');

            // Reset address detail inputs when opening edit (use saved first, then customer)
            const house = cleanValue(savedAddressDetails.houseNumber) || cleanValue(customer.house_number);
            const sector = cleanValue(savedAddressDetails.sector) || cleanValue(customer.sector);
        const city = cleanValue(savedAddressDetails.city) || cleanValue(customer.city);
        const state = cleanValue(savedAddressDetails.state) || cleanValue(customer.state);
            setEditableHouseNumber(house);
            setEditableSector(sector);
            setEditableCity(city);
            setEditableState(state);
        // Persist for next edit if they weren't saved yet
        setSavedAddressDetails({
            houseNumber: house,
            sector,
            city,
            state
        });
        }

        // Set edit mode flag
        setIsEditMode(true);
        
        // Reset field errors
        setFieldErrors({
            name: "",
            phone: "",
            email: "",
            requirement: "",
            date: "",
            time: "",
            address: ""
        });
        
        // Open dialog
        setShowAppointmentDialog(true);
    };

    // Close appointment dialog
    const closeAppointmentDialog = () => {
        setShowAppointmentDialog(false);
        setAppointmentSearchAddress("");
        setTimeError("");
        setSelectedHour("");
        setSelectedMinute("");
        setSelectedAmPm("AM");
        setIsOpen(true);
        // Cleanup appointment map
        if (appointmentMapRef.current) {
            appointmentMapRef.current.remove();
            appointmentMapRef.current = null;
        }
        if (appointmentMarkerRef.current) {
            appointmentMarkerRef.current.remove();
            appointmentMarkerRef.current = null;
        }
        setAppointmentLocation({ lat: null, lng: null, address: '' });
        setEditableFullAddress("");
        setViabilityError("");
        // Reset field errors
        setFieldErrors({
            name: "",
            phone: "",
            email: "",
            requirement: "",
            date: "",
            time: "",
            address: ""
        });
        setEditableHouseNumber("");
        setEditableSector("");
        setEditableCity("");
        setEditableState("");
        // Don't reset editable fields here - they should persist if dialog is reopened
    };

    // Handle confirmation - confirm booking
    const handleConfirmBooking = async () => {
        setShowConfirmationDialog(false);
        setConfirmationAppointmentDetails(null);
        setNeedsConfirmation(false);

        // Send "confirm" message to chatbot
        await sendMessage(language === 'en' ? "confirm" : "confirmar", false, false);
    };

    // Handle confirmation - cancel/no
    const handleCancelBooking = () => {
        setShowConfirmationDialog(false);
        setConfirmationAppointmentDetails(null);
        setNeedsConfirmation(false);
        // Optionally send a message to the chatbot
        sendMessage("No, I don't want to proceed with this booking", false, false);
    };

    // Handle edit from confirmation dialog - open appointment dialog in edit mode
    const handleEditFromConfirmation = () => {
        if (!confirmationAppointmentDetails) return;

        // Set currentAppointmentDetails from confirmationAppointmentDetails
        setCurrentAppointmentDetails(confirmationAppointmentDetails);
        
        // Close confirmation dialog
        setShowConfirmationDialog(false);
        
        // Open edit appointment dialog
        openEditAppointmentDialog();
    };

    // Handle close confirmation dialog (just close, no action)
    const handleCloseConfirmationDialog = () => {
        setShowConfirmationDialog(false);
        setConfirmationAppointmentDetails(null);
        setNeedsConfirmation(false);
    };

    return (
        <div>
            {/* Floating Button */}
            {!isOpen && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 bg-[#13486b] text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                        <div className="relative z-10 flex items-center justify-center">
                            <MessageCircle size={28} className="group-hover:rotate-12 transition-transform duration-300" />
                            <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
                    </button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className="fixed bottom-4 left-4 right-4 sm:right-6 sm:left-auto w-[calc(100%-2rem)] sm:w-96 bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col backdrop-blur-lg border border-gray-100 transform transition-all duration-300 z-50 min-h-0"
                    style={{ maxHeight: '80vh' }}
                >
                    {/* Header */}
                    <div className="bg-[#13486b] text-white p-4 flex justify-between items-center rounded-t-3xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
                            <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-8 translate-y-8"></div>
                        </div>

                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                <Bot size={24} className="text-[#13486b]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{t('chatbot.assistant')}</h3>
                                <p className="text-xs text-blue-100">{t('chatbot.alwaysHere')}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 relative z-10">
                            <button
                                onClick={toggleLanguage}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                                title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
                            >
                                <Languages size={18} />
                            </button>
                            <button
                                onClick={startNewConversation}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                                title={t('chatbot.newConversation')}
                            >
                                <MessageCirclePlusIcon size={18} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                                title={t('chatbot.close')}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white min-h-0" style={{ maxHeight: 'calc(80vh - 170px)' }}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-[#13486b]" : "bg-[#13486b]"
                                        }`}
                                >
                                    {msg.role === "user" ? (
                                        <User size={16} className="text-white" />
                                    ) : (
                                        <Bot size={16} className="text-white" />
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={`${msg.role === "user" ? "items-end" : "items-start"} flex flex-col ${msg.role === "user" ? "max-w-[85%] min-w-0" : "max-w-xs"}`}>
                                    {/* Text Message */}
                                    {msg.text && (
                                        <div className={`p-3 rounded-2xl shadow-sm ${msg.role === "user"
                                            ? "bg-[#13486b] text-white rounded-br-md"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                                            }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-line break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{msg.text}</p>
                                        </div>
                                    )}

                                    {/* HTML Summary */}
                                    {msg.htmlContent && msg.isHtml && (
                                        <div
                                            className="mt-2 chatbot-html-content text-sm"
                                            dangerouslySetInnerHTML={{ __html: msg.htmlContent }}
                                            style={{
                                                maxWidth: '100%',
                                                wordWrap: 'break-word'
                                            }}
                                        />
                                    )}

                                    {/* Edit Details Button - Show below last user message if needs confirmation */}
                                    {(() => {
                                        const lastUserIdx = getLastUserMessageIndex();
                                        const isLastUserMsg = msg.role === "user" && idx === lastUserIdx;
                                        const hasAppointmentDetails = !!currentAppointmentDetails;
                                        const intent = currentAppointmentDetails?.intent;
                                        const needsConfirmationCheck = needsConfirmation === true || intent === 'ready_for_confirmation';
                                        const notConfirmed = !confirmation;

                                        // Debug logging
                                        if (isLastUserMsg) {
                                            console.log("Edit Details Button Check:", {
                                                isLastUserMsg,
                                                hasAppointmentDetails,
                                                needsConfirmation,
                                                intent,
                                                needsConfirmationCheck,
                                                notConfirmed,
                                                showAppointmentDialog,
                                                showConfirmationDialog,
                                                currentAppointmentDetails
                                            });
                                        }

                                        return isLastUserMsg && !showAppointmentDialog && !confirmation
                                    })() && (
                                            <div className="mt-2 flex justify-end">
                                                <button
                                                    onClick={openEditAppointmentDialog}
                                                    disabled={isTyping}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                                                >
                                                    <Edit size={8} />
                                                    {t('chatbot.editDetails') || 'Edit Details'}
                                                </button>
                                            </div>
                                        )}

                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start space-x-3">
                                <TypingIndicator />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
                        {!confirmation ? (
                            <div className="flex items-center space-x-3 bg-gray-50 rounded-2xl p-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !isTyping && sendMessage()}
                                    placeholder={t('chatbot.placeholder')}
                                    disabled={isTyping}
                                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 px-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isTyping}
                                    className="bg-[#13486b] text-white p-2 rounded-xl disabled:opacity-50 hover:bg-[#2b5893] transition-colors disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startNewConversation}
                                className="w-full bg-[#13486b] text-white p-3 rounded-xl hover:bg-[#2b5893] transition-all font-medium"
                            >
                                {t('chatbot.startNewConversation')}
                            </button>
                        )}
                    </div>

                    {/* Custom Styles for HTML Content */}
                    <style>{`
                        .chatbot-html-content h3 {
                            margin-top: 0;
                            margin-bottom: 10px;
                            font-size: 1.1em;
                        }
                        .chatbot-html-content p {
                            margin: 5px 0;
                            line-height: 1.5;
                        }
                        .chatbot-html-content strong {
                            font-weight: 600;
                        }
                        .chatbot-html-content div {
                            font-size: 14px;
                        }
                    `}</style>
                </div>
            )}

            {/* Map Dialog Modal */}
            {showMapDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-[#13486b] text-white p-3 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-lg font-bold">
                                {currentAppointmentDetails && hasAddress(currentAppointmentDetails) ? t('chatbot.editAddress') : t('chatbot.selectAddressOnMap')}
                            </h3>
                            <button
                                onClick={closeMapDialog}
                                className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Search Address Input */}
                        <div className="p-3 border-b bg-gray-50 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearchAddress()}
                                    placeholder={t('chatbot.searchAddressPlaceholder')}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isSearching}
                                />
                                <button
                                    onClick={handleSearchAddress}
                                    disabled={!searchAddress.trim() || isSearching}
                                    className="px-4 py-2 bg-[#13486b] text-white rounded-md hover:bg-[#2b5893] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isSearching ? t('chatbot.searching') : t('chatbot.search')}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                {t('chatbot.coordinates')} {selectedLocation.lat != null ? Number(selectedLocation.lat).toFixed(6) : t('appointments.na')}, {selectedLocation.lng != null ? Number(selectedLocation.lng).toFixed(6) : t('appointments.na')}
                            </p>
                        </div>

                        {/* Map Container */}
                        <div className="flex-1 relative">
                            <div
                                ref={mapContainerRef}
                                className="w-full h-[50vh] rounded-lg"
                            />
                        </div>

                        {/* Instructions and Action Buttons */}
                        <div className="p-3 bg-gray-50 border-t">
                            <p className="text-xs text-gray-600 mb-3">
                                {t('chatbot.mapInstructions')}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={submitAddressFromMap}
                                    disabled={!selectedLocation.lat || !selectedLocation.lng || isTyping}
                                    className="flex-1 bg-[#13486b] text-white py-2 px-4 rounded-lg hover:bg-[#2b5893] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {t('chatbot.confirmAddress')}
                                </button>
                                <button
                                    onClick={closeMapDialog}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                                >
                                    {t('chatbot.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Booking Dialog Modal */}
            {showAppointmentDialog && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[100] p-4 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-[#13486b] text-white p-3 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('chatbot.bookAppointment')}
                            </h3>
                           
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto flex flex-col min-h-0">
                            {/* Customer Information Fields - Show name/phone/email conditionally; requirement always visible */}
                            {(() => {
                                // If in edit mode, show them
                                if (isEditMode) return true;
                                
                                const hasName = editableCustomerName.trim() || 
                                               (customerLeadData?.customer?.first_name && customerLeadData?.customer?.last_name) ||
                                               (currentAppointmentDetails?.customer?.name);
                                const hasPhone = editableCustomerPhone.trim() || 
                                                 customerLeadData?.customer?.phone ||
                                                 currentAppointmentDetails?.customer?.contact_number;
                                const hasEmail = editableCustomerEmail.trim() || 
                                                 customerLeadData?.customer?.email ||
                                                 currentAppointmentDetails?.customer?.email;
                                
                                return hasName || hasPhone || hasEmail;
                            })() && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-shrink-0 border-b pb-4">
                                    {/* Customer Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            {t('chatbot.customerName')} {isEditMode && <span className="text-red-500">*</span>}
                                            <InfoTooltip text={t('chatbot.enterFullName') || "Enter the customer's full name as it should appear on the appointment."} />
                                        </label>
                                        <input
                                            type="text"
                                            value={editableCustomerName}
                                            onChange={(e) => {
                                                setEditableCustomerName(e.target.value);
                                                if (isEditMode) {
                                                    setTimeout(() => validateEditModeFields(), 0);
                                                }
                                            }}
                                            placeholder={t('chatbot.customerName')}
                                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {fieldErrors.name && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                                        )}
                                    </div>

                                    {/* Customer Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            {t('chatbot.customerPhone')} {isEditMode && <span className="text-red-500">*</span>}
                                            <InfoTooltip text={t('chatbot.enterPhoneWithCountryCode') || 'Select country code and enter phone number.'} />
                                        </label>
                                        <div className="flex gap-2">
                                            {/* Country Code Dropdown */}
                                            <div className="flex-shrink-0">
                                                <CustomDropdown
                                                    value={selectedCountryCode}
                                                    onChange={(value) => {
                                                        setSelectedCountryCode(value);
                                                        if (isEditMode) {
                                                            setTimeout(() => validateEditModeFields(), 0);
                                                        }
                                                    }}
                                                    options={countryCodes.map((country) => ({
                                                        value: country.code,
                                                        label: `${country.flag} ${country.code}`,
                                                        searchText: `${country.code} ${country.country} ${country.flag}`
                                                    }))}
                                                    minWidth="100px"
                                                    searchable={true}
                                                    searchPlaceholder="Search country or code..."
                                                />
                                            </div>
                                            {/* Phone Number Input */}
                                            <div className="flex-1 min-w-0">
                                                <input
                                                    type="tel"
                                                    value={editableCustomerPhone}
                                                    onChange={(e) => {
                                                        handlePhoneNumberChange(e.target.value);
                                                        if (isEditMode) {
                                                            setTimeout(() => validateEditModeFields(), 0);
                                                        }
                                                    }}
                                                    placeholder={selectedCountryCode === "+58" ? t('chatbot.phonePlaceholder') || "04121234567" : t('chatbot.phonePlaceholderInternational') || "Phone number"}
                                                    maxLength={selectedCountryCode === "+58" ? 11 : 15}
                                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                                />
                                            </div>
                                        </div>
                                        {fieldErrors.phone && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                                        )}
                                        {!fieldErrors.phone && editableCustomerPhone && !isValidPhoneNumber(editableCustomerPhone, selectedCountryCode) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {selectedCountryCode === "+58" 
                                                    ? (t('chatbot.phoneValidationError') || 'Phone number must be exactly 10 digits')
                                                    : (t('chatbot.phoneValidationErrorInternational') || 'Phone number must be between 7 and 15 digits')
                                                }
                                            </p>
                                        )}
                                        {!fieldErrors.phone && editableCustomerPhone && isValidPhoneNumber(editableCustomerPhone, selectedCountryCode) && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {t('chatbot.fullPhoneNumber') || 'Full number'}: {getFullPhoneNumber()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Customer Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            {t('chatbot.customerEmail')} {isEditMode && <span className="text-red-500">*</span>}
                                            <InfoTooltip text={t('chatbot.enterValidEmail') || 'Add a valid email for confirmations (optional if not required).'} />
                                        </label>
                                        <input
                                            type="email"
                                            value={editableCustomerEmail}
                                            onChange={(e) => {
                                                setEditableCustomerEmail(e.target.value);
                                                if (isEditMode) {
                                                    setTimeout(() => validateEditModeFields(), 0);
                                                }
                                            }}
                                            placeholder={t('chatbot.customerEmail')}
                                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                                        )}
                                        {!fieldErrors.email && editableCustomerEmail && !isValidEmail(editableCustomerEmail) && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {t('chatbot.emailValidationError') || 'Please enter a valid email address'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Customer Requirement - shown in second row in edit mode */}
                            {isEditMode && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-shrink-0 border-b pb-4">
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            {t('chatbot.customerRequirement')} <span className="text-red-500">*</span>
                                            <InfoTooltip text={t('chatbot.describeRequirement')} />
                                        </label>
                                        <CustomDropdown
                                            value={editableCustomerRequirement}
                                            onChange={(value) => {
                                                setEditableCustomerRequirement(value);
                                                setTimeout(() => validateEditModeFields(), 0);
                                            }}
                                            options={[
                                                { value: "", label: isLoadingCustomerIssues ? t('chatbot.loading') : t('chatbot.selectRequirement') },
                                                ...customerIssues.map((issue) => ({
                                                    value: issue.customer_issue,
                                                    label: issue.customer_issue
                                                }))
                                            ]}
                                            placeholder={isLoadingCustomerIssues ? t('chatbot.loading') : t('chatbot.selectRequirement')}
                                            disabled={isLoadingCustomerIssues}
                                            error={!!fieldErrors.requirement}
                                            searchable={true}
                                            searchPlaceholder="Search requirements..."
                                        />
                                        {fieldErrors.requirement && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.requirement}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Customer Requirement - always shown when not in edit mode */}
                            {!isEditMode && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-shrink-0 border-b pb-4">
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                            {t('chatbot.customerRequirement')} <span className="text-red-500">*</span>
                                            <InfoTooltip text={t('chatbot.describeRequirement')} />
                                        </label>
                                        <CustomDropdown
                                            value={editableCustomerRequirement}
                                            onChange={(value) => {
                                                setEditableCustomerRequirement(value);
                                            }}
                                            options={[
                                                { value: "", label: isLoadingCustomerIssues ? t('chatbot.loading') : t('chatbot.selectRequirement') },
                                                ...customerIssues.map((issue) => ({
                                                    value: issue.customer_issue,
                                                    label: issue.customer_issue
                                                }))
                                            ]}
                                            placeholder={isLoadingCustomerIssues ? t('chatbot.loading') : t('chatbot.selectRequirement')}
                                            disabled={isLoadingCustomerIssues}
                                            error={!!fieldErrors.requirement}
                                            searchable={true}
                                            searchPlaceholder="Search requirements..."
                                        />
                                        {fieldErrors.requirement && (
                                            <p className="text-red-500 text-xs mt-1">{fieldErrors.requirement}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Date and Time Selection - Single Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
                                {/* Date Selection */}
                                <div className="relative">
                                    <label
                                        className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 cursor-pointer hover:text-[#13486b] transition-colors"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        {t('chatbot.selectDate')} <span className="text-red-500">*</span>
                                        <InfoTooltip text={t('chatbot.dateInstruction') || 'Choose a date from tomorrow onward; past dates are disabled.'} />
                                    </label>
                                    <div
                                        className="date-input-wrapper relative cursor-pointer"
                                        onClick={() => {
                                            // Initialize calendar to selected date or today
                                            if (selectedDate) {
                                                // Parse YYYY-MM-DD format
                                                const [year, month, day] = selectedDate.split('-').map(Number);
                                                const date = new Date(year, month - 1, day);
                                                setCalendarMonth(date.getMonth());
                                                setCalendarYear(date.getFullYear());
                                            } else {
                                                const today = new Date();
                                                setCalendarMonth(today.getMonth());
                                                setCalendarYear(today.getFullYear());
                                            }
                                            setShowDatePicker(!showDatePicker);
                                        }}
                                    >
                                        <input
                                            type="text"
                                            readOnly
                                            value={selectedDate ? formatDateDDMMYYYY(selectedDate) : ''}
                                            placeholder="DD/MM/YYYY"
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:border-[#13486b] transition-colors bg-white ${fieldErrors.date ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    
                                    {/* Custom Calendar Dropdown */}
                                    {showDatePicker && (
                                        <div className="date-picker-container absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-full max-w-sm">
                                            {/* Calendar Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateMonth('prev');
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {new Date(calendarYear, calendarMonth).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}
                                                </h3>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateMonth('next');
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            
                                            {/* Calendar Days Header */}
                                            <div className="grid grid-cols-7 gap-1 mb-2">
                                                {(() => {
                                                    // Get day names based on language, starting from Sunday
                                                    const dayNames = [];
                                                    const locale = language === 'es' ? 'es-ES' : 'en-US';
                                                    // Create a date for Sunday (January 7, 2024 is a Sunday)
                                                    const baseDate = new Date(2024, 0, 7);
                                                    for (let i = 0; i < 7; i++) {
                                                        const date = new Date(baseDate);
                                                        date.setDate(baseDate.getDate() + i);
                                                        const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
                                                        dayNames.push(dayName);
                                                    }
                                                    return dayNames;
                                                })().map((day) => (
                                                    <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Calendar Days */}
                                            <div className="grid grid-cols-7 gap-1">
                                                {(() => {
                                                    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
                                                    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const minDateStr = getMinDate();
                                                    const [minYear, minMonth, minDay] = minDateStr.split('-').map(Number);
                                                    const minDate = new Date(minYear, minMonth - 1, minDay);
                                                    minDate.setHours(0, 0, 0, 0);
                                                    
                                                    const days = [];
                                                    
                                                    // Empty cells for days before first day of month
                                                    for (let i = 0; i < firstDay; i++) {
                                                        days.push(<div key={`empty-${i}`} className="h-8"></div>);
                                                    }
                                                    
                                                    // Days of the month
                                                    for (let day = 1; day <= daysInMonth; day++) {
                                                        const date = new Date(calendarYear, calendarMonth, day);
                                                        date.setHours(0, 0, 0, 0);
                                                        // Format as YYYY-MM-DD in local timezone
                                                        const year = date.getFullYear();
                                                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                                        const dayStr = date.getDate().toString().padStart(2, '0');
                                                        const dateString = `${year}-${month}-${dayStr}`;
                                                        // Disable today and past dates (only allow tomorrow onwards)
                                                        const isPast = date <= today;
                                                        const isSelected = selectedDate === dateString;
                                                        
                                                        days.push(
                                                            <button
                                                                key={day}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isPast) {
                                                                        handleDateSelect(day);
                                                                    }
                                                                }}
                                                                disabled={isPast}
                                                                className={`
                                                                    h-8 w-8 rounded-lg text-sm transition-colors
                                                                    ${isPast 
                                                                        ? 'text-gray-300 cursor-not-allowed' 
                                                                        : isSelected
                                                                        ? 'bg-[#13486b] text-white font-semibold'
                                                                        : 'text-gray-700 hover:bg-gray-100'
                                                                    }
                                                                `}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    }
                                                    
                                                    return days;
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {fieldErrors.date && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>
                                    )}
                                    {!fieldErrors.date && selectedDate && !isFutureDate(selectedDate) && (
                                        <p className="text-red-500 text-xs mt-1">{t('chatbot.pleaseSelectFutureDate')}</p>
                                    )}
                                    {selectedDate && (selectedTime || (selectedHour && selectedMinute)) && (() => {
                                        const timeToCheck = selectedTime || convert12To24Hour(selectedHour, selectedMinute, selectedAmPm);
                                        if (timeToCheck && !isFutureDateTime(selectedDate, timeToCheck)) {
                                            return (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {t('chatbot.pastDateTimeNotAllowed')}
                                                </p>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <label
                                        htmlFor="appointment-time-input"
                                        className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2 cursor-pointer hover:text-[#13486b] transition-colors"
                                    >
                                        <Clock className="h-4 w-4" />
                                        {t('chatbot.selectTime')} <span className="text-red-500">*</span>
                                        <InfoTooltip text={t('chatbot.timeInstruction') || 'Pick a slot between 9:00 AM and 6:00 PM (local time).'} />
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {/* Hour Select */}
                                        <div className="flex-1">
                                            <CustomDropdown
                                                value={selectedHour}
                                                onChange={(hour) => {
                                                    setSelectedHour(hour);
                                                    updateTimeFrom12Hour(hour, selectedMinute, selectedAmPm);
                                                    if (isEditMode) {
                                                        setTimeout(() => validateEditModeFields(), 0);
                                                    }
                                                }}
                                                options={[
                                                    { value: "", label: t('chatbot.hour') || 'Hour' },
                                                    ...Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => ({
                                                        value: hour.toString().padStart(2, '0'),
                                                        label: hour.toString()
                                                    }))
                                                ]}
                                                placeholder={t('chatbot.hour') || 'Hour'}
                                                error={!!fieldErrors.time}
                                            />
                                        </div>

                                        {/* Minute Select */}
                                        <div className="flex-1">
                                            <CustomDropdown
                                                value={selectedMinute}
                                                onChange={(minute) => {
                                                    setSelectedMinute(minute);
                                                    updateTimeFrom12Hour(selectedHour, minute, selectedAmPm);
                                                    if (isEditMode) {
                                                        setTimeout(() => validateEditModeFields(), 0);
                                                    }
                                                }}
                                                options={[
                                                    { value: "", label: t('chatbot.minute') || 'Min' },
                                                    ...Array.from({ length: 60 }, (_, i) => i).map((minute) => ({
                                                        value: minute.toString().padStart(2, '0'),
                                                        label: minute.toString().padStart(2, '0')
                                                    }))
                                                ]}
                                                placeholder={t('chatbot.minute') || 'Min'}
                                                error={!!fieldErrors.time}
                                            />
                                        </div>

                                        {/* AM/PM Select */}
                                        <CustomDropdown
                                            value={selectedAmPm}
                                            onChange={(ampm) => {
                                                setSelectedAmPm(ampm);
                                                
                                                // Update time validation when AM/PM changes
                                                if (selectedHour && selectedMinute) {
                                                    updateTimeFrom12Hour(selectedHour, selectedMinute, ampm);
                                                } else {
                                                    setTimeError("");
                                                }
                                                if (isEditMode) {
                                                    setTimeout(() => validateEditModeFields(), 0);
                                                }
                                            }}
                                            options={[
                                                { value: "AM", label: "AM" },
                                                { value: "PM", label: "PM" }
                                            ]}
                                            minWidth="80px"
                                            error={!!fieldErrors.time}
                                        />
                                    </div>
                                    {fieldErrors.time && (
                                        <p className="text-red-500 text-xs mt-1">{fieldErrors.time}</p>
                                    )}
                                    {!fieldErrors.time && timeError && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {timeError}
                                        </p>
                                    )}
                                    {selectedHour && selectedMinute && !timeError && !fieldErrors.time && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {t('chatbot.selected')} {selectedHour}:{selectedMinute} {selectedAmPm}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Address Selection */}
                            <div className="flex-1 flex flex-col min-h-0">
                                {fieldErrors.address && (
                                    <p className="text-red-500 text-xs mb-2">{fieldErrors.address}</p>
                                )}
                                
                                {/* Viability Error */}
                                {viabilityError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-2 flex items-center gap-2">
                                        <span className="text-red-500">⚠️</span>
                                        {viabilityError}
                                    </div>
                                )}
                                
                                {/* Viability Checking Indicator */}
                                {isCheckingViability && (
                                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm mb-2 flex items-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        {t('chatbot.checkingViability') || 'Checking address availability...'}
                                    </div>
                                )}

                                {/* Two columns: Left details, Right search + map */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
                                    {/* First Column: Address details (full address + fields) */}
                                    <div className="flex flex-col min-h-0 h-full">
                                        {/* Manual Full Address Input */}
                                        <div className="mb-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                                {t('chatbot.fullAddress') || 'Full Address'} <span className="text-red-500">*</span>
                                                <InfoTooltip text={t('chatbot.addressInstruction') || 'Search for an address or type the full address manually.'} />
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={editableFullAddress}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setEditableFullAddress(val);
                                                    setAppointmentLocation((prev) => ({ ...prev, address: val }));
                                                }}
                                                placeholder={t('chatbot.fullAddress') || 'Enter full address'}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            />
                                        </div>
                            <p className="text-xs text-gray-500 mb-2">
                                {t('chatbot.coordinates')} {appointmentLocation.lat != null ? Number(appointmentLocation.lat).toFixed(6) : t('appointments.na')}, {appointmentLocation.lng != null ? Number(appointmentLocation.lng).toFixed(6) : t('appointments.na')}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('chatbot.addressHouseNumber') || 'House Number'}</label>
                                    <input
                                        type="text"
                                        value={editableHouseNumber}
                                        onChange={(e) => setEditableHouseNumber(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('chatbot.addressSector') || 'Sector'}</label>
                                    <input
                                        type="text"
                                        value={editableSector}
                                        onChange={(e) => setEditableSector(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('chatbot.addressCity') || 'City'}</label>
                                    <input
                                        type="text"
                                        value={editableCity}
                                        readOnly
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">{t('chatbot.addressState') || 'State'}</label>
                                    <input
                                        type="text"
                                        value={editableState}
                                        readOnly
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                                {/* Selected Address Display (address already shown in input; show only guidance) */}
                                <div className="flex-1 min-h-0 overflow-y-auto">
                                    <p className="text-xs text-gray-500">
                                        {t('chatbot.mapInstructions')}
                                    </p>
                                </div>
                                    </div>

                                    {/* Second Column: Search + Map */}
                                    <div className="relative min-h-0 flex flex-col gap-2 h-full">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 flex-shrink-0">
                                            <MapPin className="h-4 w-4" />
                                            {t('chatbot.searchAddressLabel') || t('chatbot.selectAddress')} {isEditMode && <span className="text-red-500">*</span>}
                                            <InfoTooltip text={t('chatbot.addressInstruction') || 'Search for an address or click on the map to drop the marker where the service is needed.'} />
                                        </label>
                                        {/* SearchBox Component */}
                                        <div className="flex-shrink-0">
                                            <SearchBox
                                                accessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                                                options={{
                                                    language: language,
                                                    country: 'VE',
                                                    limit: 5,
                                                    types: ['address', 'place', 'locality', 'district',  'country', 'region'],
                                                   
                                                }}

                                                value={appointmentSearchAddress}
                                                onRetrieve={handleSearchBoxRetrieve}
                                                placeholder={t('chatbot.searchAddressPlaceholder')}
                                                theme={{
                                                    variables: {
                                                        fontFamily: 'inherit',
                                                        unit: '14px',
                                                        borderRadius: '6px',
                                                        boxShadow: 'none',
                                                        border: '1px solid #d1d5db',
                                                        colorBackground: '#ffffff',
                                                        colorBackgroundHover: '#f3f4f6',
                                                        colorText: '#374151',
                                                        colorPrimary: '#3b82f6'
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Map Container */}
                                        <div
                                            ref={appointmentMapContainerRef}
                                            className="w-full flex-1 min-h-[16rem] rounded-lg border border-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-6 sm:mt-4 p-3 bg-gray-50 border-t flex gap-2 flex-shrink-0">
                            <button
                                onClick={submitAppointmentBooking}
                                disabled={(() => {
                                    const hasDate = selectedDate && isFutureDate(selectedDate);
                                    const hasTime = selectedTime || (selectedHour && selectedMinute);
                                    const hasAddress = appointmentLocation.lat && appointmentLocation.lng;
                                    const hasRequirement = editableCustomerRequirement.trim();

                                    if (!hasDate || !hasTime || !hasAddress || !hasRequirement) return true;

                                    // Check if date and time is in the past
                                    const timeToCheck = selectedTime || convert12To24Hour(selectedHour, selectedMinute, selectedAmPm);
                                    if (timeToCheck && !isFutureDateTime(selectedDate, timeToCheck)) {
                                        return true;
                                    }

                                    // Check if time is within allowed range (9 AM to 6 PM)
                                    if (selectedHour && selectedMinute) {
                                        if (!isTimeInAllowedRange(selectedHour, selectedMinute, selectedAmPm)) {
                                            return true;
                                        }
                                    } else if (selectedTime) {
                                        const [hours, minutes] = selectedTime.split(':').map(Number);
                                        const totalMinutes = hours * 60 + minutes;
                                        const minMinutes = 9 * 60; // 9:00 AM
                                        const maxMinutes = 18 * 60; // 6:00 PM
                                        if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
                                            return true;
                                        }
                                    }

                                    // Check if phone number is valid
                                    if (editableCustomerPhone.trim()) {
                                        if (!isValidPhoneNumber(editableCustomerPhone, selectedCountryCode)) {
                                            return true;
                                        }
                                    }

                                    return false;
                                })()}
                                className="flex-1 bg-[#13486b] text-white py-3 px-6 rounded-lg hover:bg-[#2b5893] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('chatbot.submitDetails')}
                            </button>
                            <button
                                onClick={closeAppointmentDialog}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                {t('chatbot.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog Modal */}
            {showConfirmationDialog && confirmationAppointmentDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-[#13486b] text-white p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('chatbot.confirmAppointment')}
                            </h3>
                            {/* <button
                                onClick={handleCloseConfirmationDialog}
                                className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button> */}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Appointment Details from JSON */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h3 className="text-lg font-semibold text-[#13486b] mb-4">{t('chatbot.appointmentDetails')}</h3>

                                {confirmationAppointmentDetails.customer && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-700 mb-2">{t('appointments.customerInformation')}</h4>
                                        <p className="text-sm text-gray-600"><strong>{t('appointments.name')}:</strong> {confirmationAppointmentDetails.customer.name || t('appointments.na')}</p>
                                        <p className="text-sm text-gray-600"><strong>{t('appointments.contactNumber')}:</strong> {confirmationAppointmentDetails.customer.contact_number || t('appointments.na')}</p>
                                        {confirmationAppointmentDetails.customer.email && (
                                            <p className="text-sm text-gray-600"><strong>{t('chatbot.customerEmail')}:</strong> {confirmationAppointmentDetails.customer.email}</p>
                                        )}
                                        <p className="text-sm text-gray-600"><strong>{t('appointments.address')}:</strong> {confirmationAppointmentDetails.customer.address || t('appointments.na')}</p>
                                        {confirmationAppointmentDetails.customer.house_number && (
                                            <p className="text-sm text-gray-600"><strong>{t('chatbot.addressHouseNumber') || 'House Number'}:</strong> {confirmationAppointmentDetails.customer.house_number}</p>
                                        )}
                                        {confirmationAppointmentDetails.customer.sector && (
                                            <p className="text-sm text-gray-600"><strong>{t('chatbot.addressSector') || 'Sector'}:</strong> {confirmationAppointmentDetails.customer.sector}</p>
                                        )}
                                        {confirmationAppointmentDetails.customer.city && (
                                            <p className="text-sm text-gray-600"><strong>{t('chatbot.addressCity') || 'City'}:</strong> {confirmationAppointmentDetails.customer.city}</p>
                                        )}
                                        {confirmationAppointmentDetails.customer.state && (
                                            <p className="text-sm text-gray-600"><strong>{t('chatbot.addressState') || 'State'}:</strong> {confirmationAppointmentDetails.customer.state}</p>
                                        )}
                                        {confirmationAppointmentDetails.customer.latitude && confirmationAppointmentDetails.customer.longitude && (
                                            <p className="text-sm text-gray-600">
                                                <strong>{t('chatbot.coordinates')}:</strong> {Number(confirmationAppointmentDetails.customer.latitude).toFixed(6)}, {Number(confirmationAppointmentDetails.customer.longitude).toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {confirmationAppointmentDetails.service && (
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-2">{t('appointments.serviceInformation')}</h4>
                                        <p className="text-sm text-gray-600"><strong>{t('appointments.issueDescription')}:</strong> {confirmationAppointmentDetails.service.customer_requirement || t('appointments.na')}</p>
                                        <p className="text-sm text-gray-600"><strong>{t('appointments.date')}:</strong> {confirmationAppointmentDetails.service.date || t('appointments.na')}</p>
                                        <p className="text-sm text-gray-600"><strong>{t('appointments.time')}:</strong> {confirmationAppointmentDetails.service.time || t('appointments.na')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-gray-50 border-t flex gap-3">
                            <button
                                onClick={handleEditFromConfirmation}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                {t('chatbot.editDetails')}
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                disabled={isTyping}
                                className="flex-1 bg-[#13486b] text-white py-3 px-6 rounded-lg hover:bg-[#2b5893] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('chatbot.confirmBooking')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Dialog Modal */}
            {showErrorDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        {/* Header */}
                        <div className="bg-red-500 text-white p-4 flex justify-between items-center rounded-t-lg">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                { 'Error'}
                            </h3>
                            <button
                                onClick={() => setShowErrorDialog(false)}
                                className="p-1 hover:bg-red-600 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-gray-700">{errorDialogMessage}</p>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button
                                onClick={() => setShowErrorDialog(false)}
                                className="px-6 py-2 bg-[#13486b] text-white rounded-lg hover:bg-[#2b5893] transition-colors font-medium"
                            >
                                {t('chatbot.close') || 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}