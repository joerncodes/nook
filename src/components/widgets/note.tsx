type Props = { body: string };

export function NoteWidget({ body }: Props) {
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
      {body}
    </div>
  );
}
