declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  export const HardDrive: LucideIcon;
  export const Upload: LucideIcon;
  export const FileText: LucideIcon;
  export const Cloud: LucideIcon;
  export const Wallet: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
} 
