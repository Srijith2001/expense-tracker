import React, { useEffect, useRef, useState } from 'react';
import './CustomDropdown.css';

interface Option {
    value: string;
    label: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className = "",
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update selected label when value changes
    useEffect(() => {
        const selectedOption = options.find(option => option.value === value);
        setSelectedLabel(selectedOption ? selectedOption.label : placeholder);
    }, [value, options, placeholder]);

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

    const handleOptionClick = (option: Option) => {
        onChange(option.value);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
            <div
                className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
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
                <span className="dropdown-value">{selectedLabel}</span>
                <svg
                    className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}
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
                <div className="dropdown-options">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`dropdown-option ${value === option.value ? 'selected' : ''}`}
                            onClick={() => handleOptionClick(option)}
                            role="option"
                            aria-selected={value === option.value}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
