import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, Bot, User, Sparkles, Languages, MessageCirclePlusIcon, MapPin } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


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

const resolveInitialChatbotId = (explicitId) => {
    if (explicitId) return explicitId;
    return getChatbotIdFromUrl();
};

export default function ChatbotWidget({ onAppointmentCreated, chatbotId: propChatbotId, id: propId }) {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(true);
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
    const [showMapDialog, setShowMapDialog] = useState(false);
    const [addressInput, setAddressInput] = useState("");
    const [searchAddress, setSearchAddress] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState({ lat: null, lng: null, address: '' });
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sessionInitializedRef = useRef(false);
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

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
            setLanguage('es');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    const sendMessage = async (initialMessage = null, isInitialization = false, isAddressUpdate = false) => {
        const messageToSend = initialMessage !== null ? initialMessage : input.trim();
        
       

        // For initialization, allow empty message; for user input, require non-empty
        if (!isInitialization && (!messageToSend || isTyping)) return;
        
        // Validation: Check if previous response needed confirmation but coordinates are missing
        // Skip validation if this is an address update from the map dialog
        if (!isInitialization && !isAddressUpdate && needsConfirmation && currentAppointmentDetails) {
            if (isAddressMissing(currentAppointmentDetails)) {
                // Show validation error message
                setMessages((prev) => [...prev, {
                    role: "bot",
                    text: t('chatbot.coordinatesNotFound'),
                    isHtml: false,
                    htmlContent: null
                }]);
                setIsTyping(false);
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
                return; // Don't send the message to API
            }
        }
        
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
                
                // Track if response needs confirmation
                const responseNeedsConfirmation = data.needs_confirmation === true || appointmentDetails.needs_confirmation === true;
                setNeedsConfirmation(responseNeedsConfirmation);
                
                // Store appointment details for address checking (always store if they exist)
                // Only update if we have new appointment details, don't clear if response doesn't have them
                if (appointmentDetails && Object.keys(appointmentDetails).length > 0) {
                    console.log("Storing appointment details:", appointmentDetails);
                    console.log("Customer data:", appointmentDetails.customer);
                    console.log("Last user message index:", lastUserMessageIndex);
                    console.log("Needs confirmation:", responseNeedsConfirmation);
                    setCurrentAppointmentDetails(appointmentDetails);

                    if(appointmentDetails.customer.latitude && appointmentDetails.customer.longitude){
                        setSelectedLocation({
                            lat: appointmentDetails.customer.latitude,
                            lng: appointmentDetails.customer.longitude,
                            address: appointmentDetails.customer.address
                        });
                    }
                    
                    // If coordinates are found, reset needsConfirmation
                    if (!isAddressMissing(appointmentDetails)) {
                        setNeedsConfirmation(false);
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

    // Initialize session when chatbotId is found from URL
    useEffect(() => {
        // Only initialize if we have a chatbotId, no sessionId yet, and haven't initialized before
        if (chatbotId && !sessionId && !sessionInitializedRef.current && !isTyping) {
            sessionInitializedRef.current = true; // Mark as initializing to prevent duplicate calls
            console.log("Initializing session with chatbot ID:", chatbotId);
            // Use sendMessage function for initialization with empty message
            sendMessage("", true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatbotId]); // Only run when chatbotId changes

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
    };

    const toggleLanguage = () => {
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
            let initialCenter = [-66.9, 10.5]; // Default to Venezuela center
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
                zoom: initialZoom
            });

            mapRef.current = map;

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
        }
    }, [selectedLocation, showMapDialog]);

    // Reverse geocode coordinates to get address
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&access_token=${mapboxgl.accessToken}&language=${language}`
            );
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                // v6 API response structure - use place_name or full_address
                const feature = data.features[0];
                const address = feature.properties?.full_address || feature.properties?.place_name || feature.place_name || `${lat}, ${lng}`;
                setSelectedLocation({ lat, lng, address });
            } else {
                setSelectedLocation({ lat, lng, address: `${lat}, ${lng}` });
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            setSelectedLocation({ lat, lng, address: `${lat}, ${lng}` });
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
                    className="fixed bottom-6 right-6 w-96 bg-white rounded-3xl shadow-2xl flex flex-col backdrop-blur-lg border border-gray-100 transform transition-all duration-300 z-50"
                    style={{ maxHeight: '600px' }}
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
                            {/* <button
                                onClick={toggleLanguage}
                                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                                title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
                            >
                                <Languages size={18} />
                            </button> */}
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white" style={{ maxHeight: '400px' }}>
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
                                <div className={`${msg.role === "user" ? "items-end" : "items-start"} flex flex-col max-w-xs`}>
                                    {/* Text Message */}
                                    {msg.text && (
                                        <div className={`p-3 rounded-2xl shadow-sm ${msg.role === "user"
                                            ? "bg-[#13486b] text-white rounded-br-md"
                                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                                            }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
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

                                    {/* Address Button - Show below last user message if address is missing */}
                                    {(() => {
                                        const lastUserIdx = getLastUserMessageIndex();
                                        const isLastUserMsg = msg.role === "user" && idx === lastUserIdx;
                                        const hasAppointmentDetails = !!currentAppointmentDetails;
                                        const intentCheck = !currentAppointmentDetails || currentAppointmentDetails.intent !== 'ready_for_confirmation';
                                        const addressMissing = currentAppointmentDetails ? isAddressMissing(currentAppointmentDetails) : false;
                                        
                                        if (isLastUserMsg) {
                                            console.log("Button check for message", idx, {
                                                isLastUserMsg,
                                                hasAppointmentDetails,
                                                intentCheck,
                                                addressMissing,
                                                showMapDialog,
                                                appointmentDetails: currentAppointmentDetails
                                            });
                                        }
                                        
                                        return isLastUserMsg && 
                                               hasAppointmentDetails && 
                                               intentCheck && 
                                              
                                               !confirmation &&
                                               !showMapDialog;
                                    })() && (
                                        <div className="mt-2 flex justify-end">
                                            <button
                                                onClick={handleAddressButtonClick}
                                                disabled={isTyping}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-50"
                                            >
                                                <MapPin size={8} />
                                                {currentAppointmentDetails && hasAddress(currentAppointmentDetails) ? t('chatbot.editAddress') : t('chatbot.addAddress')}
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
                        <div className="p-3 border-b bg-gray-50">
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
                        </div>

                        {/* Map Container */}
                        <div className="flex-1 relative">
                            <div 
                                ref={mapContainerRef} 
                                className="w-full h-[50vh] rounded-lg"
                            />
                            
                            {/* Selected Address Display */}
                            {selectedLocation.address && (
                                <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">{t('chatbot.selectedAddress')}</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedLocation.address}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t('chatbot.coordinates')} {selectedLocation.lat != null ? Number(selectedLocation.lat).toFixed(6) : t('appointments.na')}, {selectedLocation.lng != null ? Number(selectedLocation.lng).toFixed(6) : t('appointments.na')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Instructions and Action Buttons */}
                        <div className="p-3 bg-gray-50 border-t">
                            <p className="text-xs text-gray-600 mb-3">
                                {t('chatbot.mapInstructions')}
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
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
        </div>
    );
}