import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean; err?: unknown };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: unknown) { return { hasError: true, err }; }
  componentDidCatch(err: unknown, info: unknown) { console.error("IPod crash:", err, info); }
  render() {
    if (this.state.hasError) return this.props.fallback ?? (
      <div className="p-4 text-sm">Something went wrong in iPod. Check console.</div>
    );
    return this.props.children;
  }
}
