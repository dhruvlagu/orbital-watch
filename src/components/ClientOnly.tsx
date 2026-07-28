import { useEffect, useState } from "react";

/**
 * ClientOnly - wrapper that only renders children on the client side.
 * Use this for components that access window/document properties to avoid hydration mismatches.
 */
export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
