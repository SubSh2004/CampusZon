interface BrandNameProps {
  className?: string;
}

export default function BrandName({ className = '' }: BrandNameProps) {
  return (
    <span className={className}>
      Campus<span style={{ color: '#e69d35' }}>Zon</span>
    </span>
  );
}
