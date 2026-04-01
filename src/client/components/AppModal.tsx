import type { MouseEvent, ReactNode, ReactPortal } from "react";
import { createPortal } from "react-dom";

interface AppModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  overlayClassName: string;
  contentClassName: string;
  overlayTestId?: string;
  contentTestId?: string;
  children: ReactNode;
}

export function AppModal({
  isOpen,
  onRequestClose,
  overlayClassName,
  contentClassName,
  overlayTestId,
  contentTestId,
  children,
}: AppModalProps): ReactPortal | null {
  if (!isOpen) {
    return null;
  }

  const handleContentClick = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
      data-testid={overlayTestId}
      onClick={onRequestClose}
    >
      <div
        className={contentClassName}
        data-testid={contentTestId}
        onClick={handleContentClick}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
