// The shell (src/app) tells the rest of the app which portals exist in this build,
// so pages can show links such as "Create a patient account" only when that module is present.
import { createContext, useContext } from 'react';

export const PortalContext = createContext({ publicLinks: [] });
export const usePortal = () => useContext(PortalContext);
