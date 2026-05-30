import Skeleton from './Skeleton';

export default function PageContentFallback() {
  return (
    <div className="page-content-fallback" aria-busy="true" aria-label="Chargement de la page">
      <Skeleton className="skel-h-10" />
      <Skeleton className="skel-h-24" />
      <Skeleton className="skel-h-24" />
      <Skeleton className="skel-h-24" />
    </div>
  );
}
