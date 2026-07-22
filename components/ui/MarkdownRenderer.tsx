// components/ui/MarkdownRenderer.tsx
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="space-y-3 leading-relaxed">
      <ReactMarkdown
        components={{
          // Mengatur tampilan teks biasa
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          // Mengatur tampilan teks TEBAL (Bold)
          strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
          // Mengatur tampilan List/Peluru
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          // Mengatur tampilan Heading / Judul
          h1: ({ node, ...props }) => <h1 className="text-xl font-black mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
          // Mengatur garis pemisah (---)
          hr: ({ node, ...props }) => <hr className="border-slate-300 dark:border-slate-600 my-4" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}