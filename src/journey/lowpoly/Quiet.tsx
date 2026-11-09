"use client";

import { Component, type ReactNode } from "react";

/** Renders nothing if its children fail (no WebGL, a missing asset), so the rest keeps working. */
export class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
