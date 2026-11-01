export function OfficeIllustration() {
  const alt = 'Three little agents at their desks, ready to explore the internet for you'
  return (
    <div className="office-illustration">
      <img className="office-art-light" src="/office-light.svg" alt={alt} width="900" height="470" />
      <img className="office-art-dark" src="/office-dark.svg" alt={alt} width="900" height="470" />
    </div>
  )
}
