type ButtonProps = {
    text: string;
};

export default function Button({ text }: ButtonProps) {
    return (
        <button
            type="submit"
            className="w-full rounded bg-[#5460c4] p-2 text-white hover:bg-[#6D7CFF]"
        >
            {text}
        </button>
    );
}