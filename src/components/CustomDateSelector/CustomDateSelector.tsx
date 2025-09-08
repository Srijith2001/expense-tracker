import React, { useEffect, useRef, useState } from 'react';
import './CustomDateSelector.css';

interface CustomDateSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    max?: string;
    min?: string;
    includeTime?: boolean;
}

const CustomDateSelector: React.FC<CustomDateSelectorProps> = ({
    value,
    onChange,
    placeholder = "Select a date",
    className = "",
    max,
    min,
    includeTime = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayValue, setDisplayValue] = useState("");
    const [selectedDate, setSelectedDate] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        day: new Date().getDate()
    });

    // Ensure month is always within bounds
    const safeMonth = Math.max(0, Math.min(11, selectedDate.month || 0));
    const [selectedTime, setSelectedTime] = useState({
        hour: new Date().getHours(),
        minute: new Date().getMinutes(),
        period: new Date().getHours() >= 12 ? 'PM' : 'AM'
    });
    const [viewMode, setViewMode] = useState<'dropdown' | 'calendar' | 'clock'>('dropdown');
    const [hoveredZone, setHoveredZone] = useState<'hour' | 'minute' | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Format date for display
    const formatDate = (dateStr: string) => {
        if (!dateStr) return placeholder;
        const date = new Date(dateStr);
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (includeTime) {
            dateOptions.hour = '2-digit';
            dateOptions.minute = '2-digit';
            dateOptions.hour12 = true;
        }

        return date.toLocaleDateString('en-IN', dateOptions);
    };

    // Update display value when value changes
    useEffect(() => {
        setDisplayValue(formatDate(value));
        if (value) {
            const date = new Date(value);
            setSelectedDate({
                year: date.getFullYear(),
                month: date.getMonth(),
                day: date.getDate()
            });
            if (includeTime) {
                const { period } = convertTo12Hour(date.getHours());
                setSelectedTime({
                    hour: date.getHours(),
                    minute: date.getMinutes(),
                    period
                });
            }
        }
    }, [value, placeholder, includeTime]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Generate years array
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    // Generate months array
    const months = [
        { value: 0, label: 'January' },
        { value: 1, label: 'February' },
        { value: 2, label: 'March' },
        { value: 3, label: 'April' },
        { value: 4, label: 'May' },
        { value: 5, label: 'June' },
        { value: 6, label: 'July' },
        { value: 7, label: 'August' },
        { value: 8, label: 'September' },
        { value: 9, label: 'October' },
        { value: 10, label: 'November' },
        { value: 11, label: 'December' }
    ];

    // Generate days array based on selected month and year
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1);

    // Calendar view functions
    const getCalendarDays = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const current = new Date(startDate);

        // Generate 42 days (6 weeks) to fill the calendar
        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return days;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return date.getFullYear() === selectedDate.year &&
            date.getMonth() === selectedDate.month &&
            date.getDate() === selectedDate.day;
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === selectedDate.month;
    };

    const isDisabled = (date: Date) => {
        const dateStr = date.toISOString().slice(0, 10);
        if (max && dateStr > max) return true;
        if (min && dateStr < min) return true;
        return false;
    };

    const handleCalendarDateClick = (date: Date) => {
        if (isDisabled(date)) return;

        setSelectedDate({
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate()
        });

        if (includeTime) {
            // Switch to clock view for time selection
            setViewMode('clock');
        } else {
            // If no time needed, close immediately
            const dateStr = date.toISOString().slice(0, 10);
            onChange(dateStr);
            setIsOpen(false);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate.year, selectedDate.month + (direction === 'next' ? 1 : -1), 1);
        setSelectedDate({
            year: newDate.getFullYear(),
            month: newDate.getMonth(),
            day: Math.min(selectedDate.day, getDaysInMonth(newDate.getFullYear(), newDate.getMonth()))
        });
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleDateChange = (type: 'year' | 'month' | 'day', newValue: number) => {
        const newDate = { ...selectedDate, [type]: newValue };

        // Validate the date
        const daysInMonth = getDaysInMonth(newDate.year, newDate.month);
        if (newDate.day > daysInMonth) {
            newDate.day = daysInMonth;
        }

        setSelectedDate(newDate);

        // Create the date string
        let dateStr = `${newDate.year}-${String(newDate.month + 1).padStart(2, '0')}-${String(newDate.day).padStart(2, '0')}`;

        if (includeTime) {
            dateStr += `T${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}`;
        }

        // Check constraints
        if (max && dateStr > max) return;
        if (min && dateStr < min) return;

        onChange(dateStr);
    };

    const handleTimeChange = (type: 'hour' | 'minute' | 'period', newValue: number | 'AM' | 'PM', event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        let newTime = { ...selectedTime };

        if (type === 'period') {
            newTime.period = newValue as 'AM' | 'PM';
            // Convert current 12-hour time to 24-hour format
            const displayTime = getDisplayTime();
            newTime.hour = convertTo24Hour(displayTime.hour12, newValue as 'AM' | 'PM');
        } else if (type === 'hour') {
            // Convert 12-hour input to 24-hour format
            newTime.hour = convertTo24Hour(newValue as number, selectedTime.period as 'AM' | 'PM');
        } else {
            newTime.minute = newValue as number;
        }

        setSelectedTime(newTime);

        // Create the date string with time
        const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}T${String(newTime.hour).padStart(2, '0')}:${String(newTime.minute).padStart(2, '0')}`;

        // Check constraints
        if (max && dateStr > max) return;
        if (min && dateStr < min) return;

        onChange(dateStr);
    };

    const handleClockMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = event.clientX - rect.left - centerX;
        const mouseY = event.clientY - rect.top - centerY;

        // Calculate distance from center
        const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
        const isHourArea = distance < 50; // Within inner circle for hours

        setHoveredZone(isHourArea ? 'hour' : 'minute');
    };

    const handleClockMouseLeave = () => {
        setHoveredZone(null);
    };

    const handleClockClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const clickX = event.clientX - rect.left - centerX;
        const clickY = event.clientY - rect.top - centerY;

        // Calculate angle from center
        let angle = Math.atan2(clickY, clickX) * (180 / Math.PI);
        angle = (angle + 90 + 360) % 360; // Normalize to 0-360 degrees

        // Determine if click is in hour or minute area
        const distance = Math.sqrt(clickX * clickX + clickY * clickY);
        const isHourArea = distance < 50; // Within inner circle for hours

        let newTime = { ...selectedTime };

        if (isHourArea) {
            // Hour selection (12-hour format)
            const hour12 = Math.round(angle / 30);
            const adjustedHour = hour12 === 0 ? 12 : hour12;
            const hour24 = convertTo24Hour(adjustedHour, selectedTime.period as 'AM' | 'PM');
            newTime.hour = hour24;
        } else {
            // Minute selection
            const minute = Math.round(angle / 6);
            newTime.minute = minute;
        }

        setSelectedTime(newTime);

        // Update the value immediately
        const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}T${String(newTime.hour).padStart(2, '0')}:${String(newTime.minute).padStart(2, '0')}`;
        onChange(dateStr);
    };

    const handleApply = () => {
        let dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;

        if (includeTime) {
            dateStr += `T${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}`;
        }

        onChange(dateStr);
        setIsOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        let todayStr = today.toISOString().slice(0, 10);

        if (includeTime) {
            todayStr += `T${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
        }

        onChange(todayStr);
        setIsOpen(false);
    };

    // Clock interaction functions
    const handleClockTimeSelect = (hour: number, minute: number) => {
        setSelectedTime({ hour, minute, period: selectedTime.period });

        const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        // Check constraints
        if (max && dateStr > max) return;
        if (min && dateStr < min) return;

        onChange(dateStr);
        setIsOpen(false);
    };

    const handleClockBackToCalendar = () => {
        setViewMode('calendar');
    };

    const getClockHandAngle = (value: number, max: number) => {
        return (value / max) * 360;
    };

    const getClockPosition = (angle: number, radius: number) => {
        const radians = (angle - 90) * (Math.PI / 180);
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;
        return { x, y };
    };

    // 12-hour format conversion functions
    const convertTo12Hour = (hour24: number) => {
        if (hour24 === 0) return { hour: 12, period: 'AM' };
        if (hour24 < 12) return { hour: hour24, period: 'AM' };
        if (hour24 === 12) return { hour: 12, period: 'PM' };
        return { hour: hour24 - 12, period: 'PM' };
    };

    const convertTo24Hour = (hour12: number, period: 'AM' | 'PM') => {
        if (period === 'AM') {
            return hour12 === 12 ? 0 : hour12;
        } else {
            return hour12 === 12 ? 12 : hour12 + 12;
        }
    };

    const getDisplayTime = () => {
        const { hour, period } = convertTo12Hour(selectedTime.hour);
        return {
            hour12: hour,
            minute: selectedTime.minute,
            period
        };
    };

    return (
        <div className={`custom-date-selector ${className}`} ref={dropdownRef}>
            <div
                className={`date-trigger ${isOpen ? 'open' : ''}`}
                onClick={toggleDropdown}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown();
                    }
                }}
            >
                <span className="date-value">{displayValue}</span>
                <svg
                    className={`date-arrow ${isOpen ? 'rotated' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </div>

            {isOpen && (
                <div className="date-options">
                    <div className="date-view-toggle">
                        <button
                            type="button"
                            className={`view-toggle-button ${viewMode === 'dropdown' ? 'active' : ''}`}
                            onClick={() => setViewMode('dropdown')}
                        >
                            Dropdown
                        </button>
                        <button
                            type="button"
                            className={`view-toggle-button ${viewMode === 'calendar' ? 'active' : ''}`}
                            onClick={() => setViewMode('calendar')}
                        >
                            Calendar
                        </button>
                    </div>

                    {viewMode === 'dropdown' ? (
                        <>
                            <div className="date-picker">
                                <div className="date-section">
                                    <label>Year</label>
                                    <select
                                        value={selectedDate.year}
                                        onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                                        className="date-select"
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="date-section">
                                    <label>Month</label>
                                    <select
                                        value={selectedDate.month}
                                        onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                                        className="date-select"
                                    >
                                        {months.map(month => (
                                            <option key={month.value} value={month.value}>{month.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="date-section">
                                    <label>Day</label>
                                    <select
                                        value={selectedDate.day}
                                        onChange={(e) => handleDateChange('day', parseInt(e.target.value))}
                                        className="date-select"
                                    >
                                        {days.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {includeTime && (
                                <div className="time-picker">
                                    <div className="time-section">
                                        <label>Hour</label>
                                        <select
                                            value={selectedTime.hour}
                                            onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                            className="time-select"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="time-section">
                                        <label>Minute</label>
                                        <select
                                            value={selectedTime.minute}
                                            onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                            className="time-select"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="date-actions">
                                <button
                                    type="button"
                                    onClick={handleToday}
                                    className="date-action-button today-button"
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApply}
                                    className="date-action-button apply-button"
                                >
                                    Apply
                                </button>
                            </div>
                        </>
                    ) : viewMode === 'calendar' ? (
                        <div className="calendar-view">
                            <div className="calendar-header">
                                <button
                                    type="button"
                                    className="calendar-nav-button"
                                    onClick={() => navigateMonth('prev')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15,18 9,12 15,6"></polyline>
                                    </svg>
                                </button>
                                <h3 className="calendar-month-year">
                                    {months[safeMonth]?.label || 'January'} {selectedDate.year}
                                </h3>
                                <button
                                    type="button"
                                    className="calendar-nav-button"
                                    onClick={() => navigateMonth('next')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9,18 15,12 9,6"></polyline>
                                    </svg>
                                </button>
                            </div>

                            <div className="calendar-weekdays">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="calendar-weekday">{day}</div>
                                ))}
                            </div>

                            <div className="calendar-grid">
                                {getCalendarDays(selectedDate.year, selectedDate.month).map((date, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`calendar-day ${isSelected(date) ? 'selected' : ''} ${isToday(date) ? 'today' : ''} ${!isCurrentMonth(date) ? 'other-month' : ''} ${isDisabled(date) ? 'disabled' : ''}`}
                                        onClick={() => handleCalendarDateClick(date)}
                                        disabled={isDisabled(date)}
                                    >
                                        {date.getDate()}
                                    </button>
                                ))}
                            </div>

                            {includeTime && (
                                <div className="calendar-time-picker">
                                    <div className="time-section">
                                        <label>Hour</label>
                                        <select
                                            value={selectedTime.hour}
                                            onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                            className="time-select"
                                        >
                                            {Array.from({ length: 24 }, (_, i) => (
                                                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="time-section">
                                        <label>Minute</label>
                                        <select
                                            value={selectedTime.minute}
                                            onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                            className="time-select"
                                        >
                                            {Array.from({ length: 60 }, (_, i) => (
                                                <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="calendar-actions">
                                <button
                                    type="button"
                                    onClick={handleToday}
                                    className="date-action-button today-button"
                                >
                                    Today
                                </button>
                            </div>
                        </div>
                    ) : viewMode === 'clock' ? (
                        <div className="clock-view">
                            <div className="clock-header">
                                <button
                                    type="button"
                                    onClick={handleClockBackToCalendar}
                                    className="clock-back-button"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClockBackToCalendar}
                                    className="clock-date-button"
                                >
                                    {String(selectedDate.day).padStart(2, '0')}-{months[safeMonth]?.label?.slice(0, 3) || 'Jan'}-{selectedDate.year}
                                </button>
                            </div>

                            <div className="clock-container">
                                <div className="clock-face"
                                    onClick={handleClockClick}
                                    onMouseMove={handleClockMouseMove}
                                    onMouseLeave={handleClockMouseLeave}>

                                    {/* Hour zone indicator */}
                                    <div className={`clock-zone clock-hour-zone ${hoveredZone === 'hour' ? 'hovered' : ''}`} />

                                    {/* Minute zone indicator */}
                                    <div className={`clock-zone clock-minute-zone ${hoveredZone === 'minute' ? 'hovered' : ''}`} />

                                    {/* Hour markers */}
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const angle = i * 30;
                                        const pos = getClockPosition(angle, 60);
                                        return (
                                            <div
                                                key={i}
                                                className="clock-hour-marker"
                                                style={{
                                                    left: `calc(50% + ${pos.x}px)`,
                                                    top: `calc(50% + ${pos.y}px)`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            >
                                                {i === 0 ? 12 : i}
                                            </div>
                                        );
                                    })}

                                    {/* Minute markers */}
                                    {Array.from({ length: 60 }, (_, i) => {
                                        if (i % 5 === 0) return null; // Skip where hour markers are
                                        const angle = i * 6;
                                        const pos = getClockPosition(angle, 70);
                                        return (
                                            <div
                                                key={i}
                                                className="clock-minute-marker"
                                                style={{
                                                    left: `calc(50% + ${pos.x}px)`,
                                                    top: `calc(50% + ${pos.y}px)`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            />
                                        );
                                    })}

                                    {/* Hour hand */}
                                    <div
                                        className="clock-hand clock-hour-hand"
                                        style={{
                                            transform: `rotate(${getClockHandAngle(getDisplayTime().hour12, 12)}deg)`
                                        }}
                                    />

                                    {/* Minute hand */}
                                    <div
                                        className="clock-hand clock-minute-hand"
                                        style={{
                                            transform: `rotate(${getClockHandAngle(selectedTime.minute, 60)}deg)`
                                        }}
                                    />

                                    {/* Center dot */}
                                    <div className="clock-center" />
                                </div>


                                <div className="clock-time-display">
                                    <span className={`time-part hour-part ${hoveredZone === 'hour' ? 'highlighted' : ''}`}>
                                        {String(getDisplayTime().hour12).padStart(2, '0')}
                                    </span>
                                    <span className="time-separator">:</span>
                                    <span className={`time-part minute-part ${hoveredZone === 'minute' ? 'highlighted' : ''}`}>
                                        {String(selectedTime.minute).padStart(2, '0')}
                                    </span>
                                    <button
                                        type="button"
                                        className="time-part period-part period-toggle"
                                        onClick={(e) => handleTimeChange('period', getDisplayTime().period === 'AM' ? 'PM' : 'AM', e)}
                                    >
                                        {getDisplayTime().period}
                                    </button>
                                </div>
                            </div>

                            <div className="clock-time-picker">
                                <div className="time-section">
                                    <label>Hour</label>
                                    <select
                                        value={getDisplayTime().hour12}
                                        onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                                        className="time-select"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="time-section">
                                    <label>Minute</label>
                                    <select
                                        value={selectedTime.minute}
                                        onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                                        className="time-select"
                                    >
                                        {Array.from({ length: 60 }, (_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="time-section period-section">
                                    <label>Period</label>
                                    <div className="period-selector">
                                        <button
                                            className={`period-button ${getDisplayTime().period === 'AM' ? 'active' : ''}`}
                                            onClick={() => handleTimeChange('period', 'AM')}
                                        >
                                            AM
                                        </button>
                                        <button
                                            className={`period-button ${getDisplayTime().period === 'PM' ? 'active' : ''}`}
                                            onClick={() => handleTimeChange('period', 'PM')}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="clock-actions">
                                <button
                                    type="button"
                                    onClick={() => handleClockTimeSelect(selectedTime.hour, selectedTime.minute)}
                                    className="date-action-button apply-button"
                                >
                                    Select Time
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default CustomDateSelector;
