const AVATAR_COLORS = ['#003366', '#3c5973', '#6666cc', '#336C37', '#87623D', '#485773'];

export function employerInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getEmployerColor(employerName: string): string {
  const hash = employerName.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function avatarStyle(employerName: string): Record<string, string> {
  return { backgroundColor: getEmployerColor(employerName) };
}

export function headerStyle(job: { employerName: string; employerImage?: string }): Record<string, string> {
  if (job.employerImage) {
    return {
      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%), url(${job.employerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  const base = getEmployerColor(job.employerName);
  return { background: `linear-gradient(145deg, ${base} 0%, ${base}cc 100%)` };
}

export function employerHeaderStyle(job: { employerName: string; employerImage?: string }): Record<string, string> {
  if (job.employerImage) {
    return {
      backgroundImage: `url(${job.employerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return avatarStyle(job.employerName);
}
