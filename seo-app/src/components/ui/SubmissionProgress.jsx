import { Check } from "lucide-react";

const steps = [
  "Author details",
  "Packages",
  "Payment",
  "Write article",
  "Submit",
];

export default function SubmissionProgress({ currentStep = 1 }) {
  const percent = ((currentStep - 1) / (steps.length - 1)) * 100;
  return (
    <section className="card mb-7 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">
          Submission progress
        </p>
        <span className="text-xs font-semibold text-blue-600">
          Step {currentStep} of {steps.length}
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-100" />
        <div
          className="absolute left-0 top-4 h-1 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
        <ol className="relative flex justify-between">
          {steps.map((step, index) => {
            const number = index + 1;
            const complete = number < currentStep;
            const active = number === currentStep;
            return (
              <li
                className="flex w-1/4 flex-col items-center text-center"
                key={step}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold transition ${complete ? "border-blue-600 bg-blue-600 text-white" : active ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-50" : "border-slate-200 bg-white text-slate-400"}`}
                >
                  {complete ? <Check size={15} /> : number}
                </span>
                <span
                  className={`mt-2 hidden text-xs font-medium sm:block ${active ? "text-blue-700" : complete ? "text-slate-700" : "text-slate-400"}`}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
