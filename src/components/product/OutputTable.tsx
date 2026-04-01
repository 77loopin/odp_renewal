import type { OutputOption } from "@/types/product";

export default function OutputTable({ options }: { options: OutputOption[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-2 px-3 font-semibold text-slate-700">출력전압</th>
            <th className="text-left py-2 px-3 font-semibold text-slate-700">최대전류</th>
          </tr>
        </thead>
        <tbody>
          {options.map((opt, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
              <td className="py-2 px-3 font-mono">{opt.voltage}</td>
              <td className="py-2 px-3 font-mono">{opt.current}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
