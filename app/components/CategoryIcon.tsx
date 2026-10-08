import React from 'react';
import {
  Landmark,
  Globe2,
  TrendingUp,
  MapPin,
  Trophy,
  UserCheck,
  UserX,
  BookOpen,
  Medal,
  ShieldAlert,
  BarChart3,
  CalendarDays,
  Newspaper,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export default function CategoryIcon({ name, ...props }: CategoryIconProps) {
  switch (name) {
    case 'Landmark':
      return <Landmark {...props} />;
    case 'Globe2':
      return <Globe2 {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'MapPin':
      return <MapPin {...props} />;
    case 'Trophy':
      return <Trophy {...props} />;
    case 'UserCheck':
      return <UserCheck {...props} />;
    case 'UserX':
      return <UserX {...props} />;
    case 'BookOpen':
      return <BookOpen {...props} />;
    case 'Medal':
      return <Medal {...props} />;
    case 'ShieldAlert':
      return <ShieldAlert {...props} />;
    case 'BarChart3':
      return <BarChart3 {...props} />;
    case 'CalendarDays':
      return <CalendarDays {...props} />;
    default:
      return <Newspaper {...props} />;
  }
}
