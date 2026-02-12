import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    zIndex?: number;
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    zIndex = 50,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4`}
            style={{ zIndex }}
        >
            <div
                className={`bg-white rounded-3xl p-8 ${sizeClasses[size]} w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto`}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{title}</h3>
                        {subtitle && <p className="text-xs font-bold text-slate-500 mt-1">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
