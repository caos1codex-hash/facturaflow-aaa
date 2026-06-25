import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-[var(--color-error)]',
    iconBg: 'bg-[#fee2e2] dark:bg-[#450a0a]',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-[var(--color-warning)]',
    iconBg: 'bg-[#fef3c7] dark:bg-[#422006]',
    buttonVariant: 'primary',
  },
  default: {
    icon: AlertCircle,
    iconColor: 'text-[var(--color-info)]',
    iconBg: 'bg-[#dbeafe] dark:bg-[#1e3a5f]',
    buttonVariant: 'primary',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  icon: IconProp,
}) {
  const config = variantConfig[variant] || variantConfig.default;
  const Icon = IconProp || config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} size="sm" onClick={() => { onConfirm?.(); onClose?.(); }}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className={`flex items-center justify-center w-12 h-12 rounded-full ${config.iconBg}`}
        >
          <Icon size={24} className={config.iconColor} />
        </motion.div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
