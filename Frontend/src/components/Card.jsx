const Card = ({
    children,
    className = "",
    hover = false,
    glow = false,
    padding = "p-6",
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className={`
        glass rounded-2xl shadow-card
        ${padding}
        ${hover ? "hover:bg-white/7 hover:border-white/15 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""}
        ${glow ? "hover:shadow-glow transition-shadow duration-300" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default Card;
