const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div
      className={`glass-card ${hover ? '' : '!bg-[var(--color-glass)] hover:!bg-[var(--color-glass)]'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-b border-white/[0.06] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-6 py-4 border-t border-white/[0.06] bg-white/[0.02] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
