# Thai Tax Playground

A modern, interactive web application for calculating Thai personal income tax (ภาษีเงินได้บุคคลธรรมดา). Built with Next.js and TypeScript, featuring real-time calculations, retirement investment optimization, and comprehensive tax visualization.

## Features

### Tax Calculation Engine
- **Rule-driven architecture** - Tax rules externalized to JSON configuration files, making it easy to add new tax years
- **Progressive tax brackets** - Accurate calculation following Thai Revenue Department guidelines
- **Real-time updates** - Instant recalculation as you adjust inputs

### Deduction Categories
- **Personal allowances** - Self, spouse, children (with 2018+ bonus), parents, disabled dependents
- **Retirement investments** - PVD, GPF, RMF, SSF, pension insurance, NSF with combined bucket limits
- **Insurance** - Life insurance, health insurance (with combined limits), parent health insurance, social security
- **Other deductions** - Home loan interest, Easy E-Receipt, donations (education 2x multiplier, general, political)

### Retirement Investment Simulator
- Interactive sliders to adjust RMF, SSF, and pension insurance contributions
- Real-time tax impact visualization
- "Maximize benefit" optimization that respects all constraint limits
- Shows remaining capacity in retirement bucket

### Visualization
- **Income allocation pie chart** - See where your money goes
- **Tax bracket breakdown** - Understand which brackets apply to your income
- **Deduction breakdown** - Visualize your deduction mix

### User Experience
- Thai language interface
- Mobile-responsive design with bottom navigation
- Clear explanations of tax calculations
- Optimization tips based on your situation

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **Validation**: Zod
- **Charts**: Recharts
- **Testing**: Vitest

## Project Structure

```
src/
├── app/                    # Next.js app router
├── components/
│   ├── forms/              # Input form components
│   ├── results/            # Tax result display components
│   ├── simulator/          # Retirement investment simulator
│   ├── ui/                 # Reusable UI primitives
│   └── TaxPlayground.tsx   # Main orchestrator component
├── hooks/
│   └── useTaxCalculation.ts # Tax calculation state hook
├── lib/
│   ├── forms/              # Shared form utilities
│   ├── tax/                # Pure calculation engine
│   └── validation.ts       # Zod validation schemas
├── rules/
│   └── TH-2567.json        # Tax rules for year 2567 (2024)
├── test/
│   └── calculator.test.ts  # Unit tests for calculator
└── types/
    └── tax.ts              # TypeScript type definitions
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ratanon97/ThaiTaxCalculator.git
cd ThaiTaxCalculator/thai-tax-playground

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
# Run tests once
npm run test:run

# Run tests in watch mode
npm run test
```

## Tax Year Support

Currently supports:
- **2567 (2024)** - Full support

Adding a new tax year:
1. Create `src/rules/TH-{year}.json` with the tax rules
2. Import and register in `src/lib/tax/rules-loader.ts`

## Architecture Highlights

### Pure Calculation Engine
The tax calculation logic in `src/lib/tax/calculator.ts` is a pure function with no side effects. Given taxpayer input and tax rules, it returns a complete calculation result. This makes it:
- Easy to test (26 unit tests with 100% logic coverage)
- Predictable and debuggable
- Reusable across different UI implementations

### Constraint System
Thai tax deductions have complex interacting limits:
- Retirement bucket: 30% of income OR 500,000 THB (whichever is lower)
- Individual caps within retirement (SSF: 200k, pension: 200k, etc.)
- Combined limits (life + health insurance: 100,000 THB)

The calculator correctly handles all constraint interactions and reports which constraint is binding.

### Error Boundaries
Charts are wrapped in error boundaries to prevent rendering failures from crashing the entire application.

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ratanon97/ThaiTaxCalculator)

## License

MIT

## Disclaimer

This calculator is for educational and planning purposes only. Always consult with a qualified tax professional or the Thai Revenue Department for official tax advice. Tax rules may change, and individual circumstances vary.
