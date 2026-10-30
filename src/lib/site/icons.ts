import {
  Zap, Sparkles, Shield, Lock, Rocket, Globe, BarChart3, Layers, Code2, Terminal,
  Cpu, Database, Cloud, Users, MessageSquare, Bell, Clock, Heart, Star, Palette,
  Puzzle, Workflow, Bot, Gauge, Github, Twitter, Linkedin, Youtube, Mail, Link2,
  type LucideIcon,
} from 'lucide-react';

// Curated icon set offered in the editor; stored on tiles by key
export const SITE_ICONS: Record<string, LucideIcon> = {
  zap: Zap,
  sparkles: Sparkles,
  shield: Shield,
  lock: Lock,
  rocket: Rocket,
  globe: Globe,
  chart: BarChart3,
  layers: Layers,
  code: Code2,
  terminal: Terminal,
  cpu: Cpu,
  database: Database,
  cloud: Cloud,
  users: Users,
  chat: MessageSquare,
  bell: Bell,
  clock: Clock,
  heart: Heart,
  star: Star,
  palette: Palette,
  puzzle: Puzzle,
  workflow: Workflow,
  bot: Bot,
  gauge: Gauge,
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  mail: Mail,
  link: Link2,
};

export function getSiteIcon(key?: string): LucideIcon {
  return (key && SITE_ICONS[key]) || Sparkles;
}
