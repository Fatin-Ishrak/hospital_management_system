// MODULE REGISTRY  (owner: Member 1)
// Finds every folder  src/modules/<name>/index.jsx  automatically. Nothing needs to be edited
// when a module is added: copy the folder in and it appears. If a module folder is missing
// (for example while another member has not pushed yet), the app simply skips it.
//
// Each module's index.jsx must export default an object like this:
//   {
//     id: 'doctor',                  // folder name
//     role: 'doctor',                // database role (admin | doctor | patient)
//     home: '/doctor',               // first address of the portal
//     requires: 'doctor' | 'patient' | null,   // linked database record that must exist
//     nav: [{ to, label, icon, end? }],         // sidebar menu
//     routes: [{ index: true, element }, { path: 'appointments', element }],  // pages inside the portal
//     publicRoutes: [{ path: '/activate', element, link: { text, label } }],  // pages for logged-out visitors (optional)
//   }
// "npm run dev:admin" (or dev:doctor / dev:patient) shows only that one module (VITE_ONLY_MODULE).

const found = import.meta.glob('../modules/*/index.jsx', { eager: true });
const only = import.meta.env.VITE_ONLY_MODULE;
const ORDER = ['admin', 'doctor', 'patient'];

export const modules = Object.values(found)
  .map((m) => m.default)
  .filter((m) => m && (!only || m.id === only))
  .sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

export const publicRoutes = modules.flatMap((m) => m.publicRoutes ?? []);
export const publicLinks = publicRoutes
  .filter((r) => r.link)
  .map((r) => ({ path: r.path, text: r.link.text, label: r.link.label }));
