const CERT_STYLES: Record<string, string> = {
  CB: "bg-blue-100 text-blue-700",
  CE: "bg-green-100 text-green-700",
  RoHS: "bg-slate-100 text-slate-600",
  Medical: "bg-purple-100 text-purple-700",
};

interface BadgeProps {
  label: string;
  className?: string;
}

export default function Badge({ label, className = "" }: BadgeProps) {
  const style = CERT_STYLES[label] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${style} ${className}`}>
      {label}
    </span>
  );
}

export function CertBadges({ certs }: { certs: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {certs.map((c) => (
        <Badge key={c} label={c} />
      ))}
    </div>
  );
}
