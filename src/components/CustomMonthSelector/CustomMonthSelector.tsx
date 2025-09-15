import React, { useEffect, useRef, useState } from 'react';
import './CustomMonthSelector.css';

interface CustomMonthSelectorProps {
    value: string; // Format: YYYY-MM, 'custom-range', or 'salary-cycle'
    onChange: (value: string) => void;
    onCustomRangeChange?: (range: { start: string; end: string }) => void;
    customRange?: { start: string; end: string };
    salaryCycleRange?: { start: string; end: string };
    onDetectSalary?: () => void;
    className?: string;
}

const CustomMonthSelector: React.FC<CustomMonthSelectorProps> = ({
    value,
    onChange,
    onCustomRangeChange,
    customRange,
    salaryCycleRange,
    onDetectSalary,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState<'month' | 'salary-cycle' | 'custom-range'>('month');
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    // Initialize mode from value
    useEffect(() => {
        if (value && value !== 'custom-range' && value !== 'salary-cycle') {
            const [year, month] = value.split('-').map(Number);
            setCurrentYear(year);
            setCurrentMonth(month - 1); // Convert to 0-based month
            setSelectedMode('month');
        } else if (value === 'custom-range') {
            setSelectedMode('custom-range');
        } else if (value === 'salary-cycle') {
            setSelectedMode('salary-cycle');
        }
    }, [value]);

    // Initialize custom range from props
    useEffect(() => {
        if (customRange) {
            setCustomStartDate(customRange.start);
            setCustomEndDate(customRange.end);
        }
    }, [customRange]);

    // Update selected label when value changes
    useEffect(() => {
        if (value === 'custom-range') {
            if (customStartDate && customEndDate) {
                const startDate = new Date(customStartDate);
                const endDate = new Date(customEndDate);
                const startFormatted = startDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'Asia/Kolkata'
                });
                const endFormatted = endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'Asia/Kolkata'
                });
                setSelectedLabel(`${startFormatted} - ${endFormatted}`);
            } else {
                setSelectedLabel("Custom Range");
            }
        } else if (value === 'salary-cycle') {
            if (salaryCycleRange && salaryCycleRange.start && salaryCycleRange.end) {
                const startDate = new Date(salaryCycleRange.start);
                const endDate = new Date(salaryCycleRange.end);
                const startFormatted = startDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'Asia/Kolkata'
                });
                const endFormatted = endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    timeZone: 'Asia/Kolkata'
                });
                setSelectedLabel(`Salary Cycle: ${startFormatted} - ${endFormatted}`);
            } else {
                setSelectedLabel("Salary Cycle");
            }
        } else if (value && value !== 'custom-range' && value !== 'salary-cycle') {
            const date = new Date(value + '-01');
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                timeZone: 'Asia/Kolkata'
            });
            setSelectedLabel(formattedDate);
        } else {
            setSelectedLabel("Select Month");
        }
    }, [value, customStartDate, customEndDate, salaryCycleRange]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsYearDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close year dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
                setIsYearDropdownOpen(false);
            }
        };

        if (isYearDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isYearDropdownOpen]);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleMonthClick = (month: number) => {
        const newValue = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
        onChange(newValue);
        setIsOpen(false);
    };

    const isMonthDisabled = (month: number) => {
        const currentDate = new Date();
        const todayYear = currentDate.getFullYear();
        const todayMonth = currentDate.getMonth();

        // If the year is current year, disable future months
        if (currentYear === todayYear) {
            return month > todayMonth;
        }

        // If the year is in the future, disable all months
        return currentYear > todayYear;
    };

    const handleYearChange = (year: number) => {
        const currentDate = new Date();
        const todayYear = currentDate.getFullYear();

        // Only allow selecting years up to current year
        if (year <= todayYear) {
            setCurrentYear(year);
            setIsYearDropdownOpen(false);
        }
    };

    const toggleYearDropdown = () => {
        setIsYearDropdownOpen(!isYearDropdownOpen);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleModeSelect = (mode: 'month' | 'salary-cycle' | 'custom-range') => {
        setSelectedMode(mode);

        if (mode === 'salary-cycle') {
            onChange('salary-cycle');
            // Automatically detect salary when selecting salary cycle
            if (onDetectSalary) {
                onDetectSalary();
            }
            setIsOpen(false);
        } else if (mode === 'custom-range') {
            onChange('custom-range');
        } else if (mode === 'month') {
            // Don't change the value yet, wait for month selection
        }
    };

    const handleCustomDateChange = (field: 'start' | 'end', date: string) => {
        if (field === 'start') {
            setCustomStartDate(date);
        } else {
            setCustomEndDate(date);
        }

        if (onCustomRangeChange) {
            const newRange = field === 'start'
                ? { start: date, end: customEndDate }
                : { start: customStartDate, end: date };
            onCustomRangeChange(newRange);
        }
    };

    const handleApplyCustomRange = () => {
        if (customStartDate && customEndDate && onCustomRangeChange) {
            onCustomRangeChange({ start: customStartDate, end: customEndDate });
            setIsOpen(false);
        }
    };

    const generateYearOptions = () => {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 10; year <= currentYear; year++) {
            years.push(year);
        }
        return years;
    };

    return (
        <div className={`custom-month-selector ${className}`} ref={dropdownRef}>
            <div
                className={`month-trigger ${isOpen ? 'open' : ''}`}
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
                <span className="month-value">{selectedLabel}</span>
                <svg
                    className={`month-arrow ${isOpen ? 'rotated' : ''}`}
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
                <div className="month-picker">
                    <div className="mode-selection">
                        <button
                            className={`mode-option ${selectedMode === 'month' ? 'selected' : ''}`}
                            onClick={() => handleModeSelect('month')}
                        >
                            Select Month
                        </button>
                        <button
                            className={`mode-option ${selectedMode === 'salary-cycle' ? 'selected' : ''}`}
                            onClick={() => handleModeSelect('salary-cycle')}
                        >
                            Salary Cycle
                        </button>
                        <button
                            className={`mode-option ${selectedMode === 'custom-range' ? 'selected' : ''}`}
                            onClick={() => handleModeSelect('custom-range')}
                        >
                            Custom Range
                        </button>
                    </div>

                    {selectedMode === 'month' && (
                        <>
                            <div className="month-picker-header">
                                <div className="year-selector-container" ref={yearDropdownRef}>
                                    <div
                                        className={`year-trigger ${isYearDropdownOpen ? 'open' : ''}`}
                                        onClick={toggleYearDropdown}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleYearDropdown();
                                            }
                                        }}
                                    >
                                        <span className="year-value">{currentYear}</span>
                                        <svg
                                            className={`year-arrow ${isYearDropdownOpen ? 'rotated' : ''}`}
                                            width="14"
                                            height="14"
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

                                    {isYearDropdownOpen && (
                                        <div className="year-options">
                                            {generateYearOptions().map(year => (
                                                <div
                                                    key={year}
                                                    className={`year-option ${currentYear === year ? 'selected' : ''}`}
                                                    onClick={() => handleYearChange(year)}
                                                    role="option"
                                                    aria-selected={currentYear === year}
                                                >
                                                    {year}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="month-grid">
                                {monthNames.map((month, index) => {
                                    const isDisabled = isMonthDisabled(index);
                                    return (
                                        <button
                                            key={index}
                                            className={`month-button ${currentMonth === index ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={() => !isDisabled && handleMonthClick(index)}
                                            disabled={isDisabled}
                                        >
                                            {month.substring(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {selectedMode === 'custom-range' && (
                        <div className="custom-range-picker">
                            <div className="custom-range-header">
                                <h3>Select Date Range</h3>
                            </div>
                            <div className="custom-range-inputs">
                                <div className="date-input-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="date-input"
                                    />
                                </div>
                                <div className="date-input-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="date-input"
                                    />
                                </div>
                            </div>
                            <div className="custom-range-footer">
                                <button
                                    className="apply-button"
                                    onClick={handleApplyCustomRange}
                                    disabled={!customStartDate || !customEndDate}
                                >
                                    Apply Range
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomMonthSelector;
