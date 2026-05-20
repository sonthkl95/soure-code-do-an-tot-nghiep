import React from 'react'

const BoolButton = ({ active, onClick, children }: any) => {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: "6px 12px",
                background: active ? "#111" : "transparent",
                color: active ? "#fff" : "#111",
                cursor: "pointer",
            }}
        >
            {children}
        </button>
    )
}

export default BoolButton