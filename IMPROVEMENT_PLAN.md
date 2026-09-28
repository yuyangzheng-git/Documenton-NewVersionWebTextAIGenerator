# Improvement Plan for RA Applications

## Current Status

This is one of the strongest repositories for a UNSW Business AI Lab RA application. It demonstrates LLM application engineering, document generation, streaming output, multi-provider AI integration, DOCX export, deployment, and a relatively complete product workflow.

## Best Research Fit

- Human-AI collaboration in document drafting
- AI-assisted decision support
- Responsible AI for generated business documents
- LLM workflow design and evaluation

Best professor matches:

- Mary-Anne Williams
- Sam Kirshner
- Peter Leonard
- Shan Pan

## Main Issues

- The README is detailed but Chinese-first; international academic reviewers may need an English summary.
- The project is described as a product, but not yet as a research artifact.
- There are no visible evaluation results.
- There are no screenshots or demo GIFs near the top of the README.
- The README does not clearly state your personal contribution.
- It is not obvious how the system could be used in a research project.

## Highest Priority Improvements

1. Add an English introduction at the top of `README.md`.
2. Add screenshots or a short demo GIF showing the full workflow.
3. Add `research.md` describing a research question, method, evaluation metrics, and limitations.
4. Add a small evaluation dataset or sample prompts.
5. Add a section called `My Contribution`.

## Suggested `research.md` Structure

Use this structure:

```md
# Research Framing

## Research Question

Can AI-assisted outline-first document generation reduce drafting time and improve document quality in business writing tasks?

## Method

Compare manual drafting with AI-assisted drafting across a small set of document-generation tasks.

## Evaluation Metrics

- Completion time
- Human quality rating
- Number of factual errors
- Number of user edits required
- Structure completeness

## Limitations

- LLM hallucination
- Prompt sensitivity
- Privacy risks for uploaded documents
- Small sample size
```

## Concrete Tasks

- Add `/docs/demo.md` with a step-by-step demo.
- Add `/docs/evaluation.md` with 5-10 sample prompts and outputs.
- Add screenshots under `/docs/images/`.
- Add one test or smoke-test command in the README.
- Add a short architecture diagram or written architecture section.
- Explain how Dify, provider abstraction, streaming, Redis, and DOCX export fit together.

## Suggested README Pitch

Add this near the top:

> This project is an AI-assisted document generation system that supports outline-first drafting, streaming LLM output, multiple model providers, rich-text editing, and DOCX export. I built it to explore how LLM systems can support structured business writing and human-AI collaboration.

## RA Application Value

Current value: High

After adding research framing and evaluation, this can be your strongest portfolio project for UNSW Business AI Lab.

