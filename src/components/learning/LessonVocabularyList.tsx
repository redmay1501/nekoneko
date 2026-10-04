'use client';

import { useState } from 'react';
import { sameLesson } from '@/features/learning/knowledge-filters';
import type { LessonContent } from '@/types/content';
import { KnowledgeListRow, type KnowledgeListRowData } from './KnowledgeListRow';

export interface VocabularyRowData extends KnowledgeListRowData {
  lesson: string;
}

/** Từ vựng lọc theo bài Minna (SC-20). */
export function LessonVocabularyList({ rows, lessons }: { rows: VocabularyRowData[]; lessons: LessonContent[] }) {
  const [lessonId, setLessonId] = useState('');
  const lesson = lessons.find((candidate) => candidate.id === lessonId);
  const visibleRows = lesson ? rows.filter((row) => sameLesson(row.lesson, lesson.id)) : rows;

  return (
    <>
      <div className="pill-tabs" role="tablist" aria-label="Lọc theo bài">
        <button type="button" role="tab" aria-selected={!lessonId} className={`tab ${!lessonId ? 'on' : ''}`} onClick={() => setLessonId('')}>Tất cả</button>
        {lessons.map((candidate) => (
          <button key={candidate.id} type="button" role="tab" aria-selected={lessonId === candidate.id}
            className={`tab ${lessonId === candidate.id ? 'on' : ''}`} onClick={() => setLessonId(candidate.id)}>{candidate.id}</button>
        ))}
      </div>
      <div className="mt-3">
        {lesson ? (
          <div className="card tight mb-3" style={{ background: 'var(--cream)', borderColor: '#F3E4CC' }}>
            <b>{lesson.id} · {lesson.name}</b>
            <p className="sm soft mt-1">{lesson.note}</p>
            <div className="row wrap mt-2" style={{ gap: 6 }}>
              <span className="chip">{lesson.dayRange}</span>
              <span className="chip">{lesson.grammarCount}</span>
              <span className="chip">{lesson.vocabCount}</span>
            </div>
          </div>
        ) : null}
        <div className="list-grid stack" style={{ gap: 9 }}>
          {visibleRows.map((row) => <KnowledgeListRow key={row.contentKey} row={row} />)}
        </div>
      </div>
    </>
  );
}
