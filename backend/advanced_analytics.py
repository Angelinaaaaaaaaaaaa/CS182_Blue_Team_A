"""
CS182 Blue Team - Advanced Deterministic Analytics
TF-IDF, Strength/Weakness extraction, Clustering, and Pattern Analysis
No LLM required - fully reproducible and explainable
"""

import os
import json
import re
from collections import Counter, defaultdict
from typing import List, Dict, Any, Set
from datetime import datetime
import math
from html.parser import HTMLParser


class AdvancedAnalytics:
    """Advanced text analytics without requiring LLM APIs"""

    def __init__(self):
        self.html_stripper = self._create_html_stripper()
        # Strength indicators (positive terms)
        self.strength_terms = {
            'correct', 'accurate', 'perfect', 'excellent', 'good', 'well', 'better',
            'successful', 'solved', 'works', 'impressive', 'strong', 'complete',
            'thorough', 'detailed', 'clear', 'coherent', 'logical', 'valid',
            'right', 'success', 'achieved', 'outperform', 'superior'
        }

        # Weakness indicators (negative terms)
        self.weakness_terms = {
            'wrong', 'incorrect', 'error', 'fail', 'failed', 'failure', 'poor',
            'bad', 'worse', 'struggle', 'struggled', 'difficulty', 'problem',
            'issue', 'bug', 'hallucination', 'hallucinate', 'confused', 'unclear',
            'incomplete', 'missing', 'unable', 'cannot', 'limitation', 'weak',
            'inaccurate', 'inconsistent', 'flawed'
        }

        # Stop words for TF-IDF - expanded to filter generic terms
        self.stop_words = {
            # Common words
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these',
            'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
            'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
            'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
            'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'if',
            # Generic terms to filter (from user feedback)
            'model', 'question', 'questions', 'problem', 'problems', 'one', 'its',
            'answer', 'answers', 'homework', 'used', 'using', 'use', 'test', 'testing',
            'tested', 'found', 'got', 'get', 'getting', 'tried', 'try', 'asked',
            'ask', 'made', 'make', 'making', 'given', 'give', 'see', 'saw', 'seen',
            # Additional meaningless terms from Global Top Terms
            'correct', 'gemini', 'reasoning', 'part', 'correctly', 'able', 'shot',
            'solution', 'step', 'solve', 'coding', 'first', 'overall', 'solutions',
            'prompt', 'non', 'parts', 'well', 'deepseek', 'chat', 'chatgpt', 'gpt',
            'claude', 'llama', 'qwen', 'mistral', 'kimi', 'perplexity', 'grok',
            # Additional terms to exclude based on user feedback
            'special', 'participation', 'noncoding', 'thinking', 'pro', 'opus',
            'sonnet', 'flash', 'extended', 'written', 'oss', 'alert', 'prof'
        }

    def _create_html_stripper(self):
        """Create a simple HTML tag stripper"""
        class HTMLStripper(HTMLParser):
            def __init__(self):
                super().__init__()
                self.reset()
                self.strict = False
                self.convert_charrefs = True
                self.text = []

            def handle_data(self, d):
                self.text.append(d)

            def get_text(self):
                return ''.join(self.text)

        return HTMLStripper

    def strip_html(self, html_text: str) -> str:
        """Remove HTML tags from text"""
        if not html_text:
            return ""
        stripper = self.html_stripper()
        try:
            stripper.feed(html_text)
            return stripper.get_text()
        except:
            # Fallback to regex if HTML parsing fails
            return re.sub(r'<[^>]+>', ' ', html_text)

    def tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        if not text:
            return []
        # Convert to lowercase and extract words
        words = re.findall(r'\b[a-z]{3,}\b', text.lower())
        # Filter stop words
        return [w for w in words if w not in self.stop_words]

    def compute_tf(self, tokens: List[str]) -> Dict[str, float]:
        """Compute term frequency"""
        if not tokens:
            return {}
        counter = Counter(tokens)
        total = len(tokens)
        return {term: count / total for term, count in counter.items()}

    def compute_idf(self, documents: List[List[str]]) -> Dict[str, float]:
        """Compute inverse document frequency"""
        doc_count = len(documents)
        if doc_count == 0:
            return {}

        # Count documents containing each term
        doc_freq = defaultdict(int)
        for doc in documents:
            unique_terms = set(doc)
            for term in unique_terms:
                doc_freq[term] += 1

        # Compute IDF
        idf = {}
        for term, freq in doc_freq.items():
            idf[term] = math.log(doc_count / (1 + freq))

        return idf

    def compute_tfidf(self, documents: List[str]) -> Dict[str, Dict[str, float]]:
        """Compute TF-IDF for all documents"""
        # Tokenize all documents
        tokenized_docs = [self.tokenize(doc) for doc in documents]

        # Compute IDF
        idf = self.compute_idf(tokenized_docs)

        # Compute TF-IDF for each document
        tfidf_scores = {}
        for i, tokens in enumerate(tokenized_docs):
            tf = self.compute_tf(tokens)
            tfidf = {}
            for term, tf_score in tf.items():
                tfidf[term] = tf_score * idf.get(term, 0)
            tfidf_scores[str(i)] = tfidf

        return tfidf_scores

    def extract_top_terms(self, tfidf_scores: Dict[str, float], top_n: int = 10) -> List[tuple]:
        """Extract top N terms by TF-IDF score"""
        sorted_terms = sorted(tfidf_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_terms[:top_n]

    def extract_strengths_weaknesses(self, text: str) -> Dict[str, List[str]]:
        """Extract strength and weakness mentions from text"""
        if not text:
            return {'strengths': [], 'weaknesses': []}

        text_lower = text.lower()
        sentences = re.split(r'[.!?]+', text)

        # Vague/generic phrases to filter out
        vague_phrases = {
            'one notable part', 'notable part', 'interaction was when',
            'part of the interaction', 'overall', 'general', 'basically',
            'it was', 'there was', 'seemed to', 'appeared to',
            'might be', 'could be', 'would be', 'may be'
        }

        strengths = []
        weaknesses = []

        for sentence in sentences:
            sentence_lower = sentence.lower()
            words = set(self.tokenize(sentence))
            clean = sentence.strip()

            # Skip if too short or too long
            if not clean or len(clean) < 30 or len(clean) > 250:
                continue

            # Skip vague sentences
            is_vague = any(phrase in sentence_lower for phrase in vague_phrases)
            if is_vague:
                continue

            # Skip if sentence is just meta-commentary about the interaction
            if any(meta in sentence_lower for meta in ['i thought', 'i found', 'it showed', 'it demonstrates']):
                # Only skip if it doesn't have specific details (less than 50 chars of content)
                if len(clean) < 60:
                    continue

            # Check for strength indicators
            if words & self.strength_terms:
                # Must have at least one concrete noun or specific detail
                if len(words) >= 8:  # Require substantial content
                    strengths.append(clean[:200])  # Truncate long sentences

            # Check for weakness indicators
            if words & self.weakness_terms:
                if len(words) >= 8:  # Require substantial content
                    weaknesses.append(clean[:200])

        return {
            'strengths': strengths[:5],  # Top 5 strength mentions
            'weaknesses': weaknesses[:5]  # Top 5 weakness mentions
        }

    def cluster_posts(self, posts: List[Dict[str, Any]], max_clusters: int = 5) -> List[Dict[str, Any]]:
        """Simple clustering using keyword similarity to find representative posts"""
        if len(posts) <= max_clusters:
            return posts

        # Compute TF-IDF for all posts (using titles since content is empty)
        documents = [p.get('title', '') for p in posts]
        tfidf_scores = self.compute_tfidf(documents)

        # Find posts with most distinctive content (highest average TF-IDF)
        post_scores = []
        for i, post in enumerate(posts):
            scores = tfidf_scores.get(str(i), {})
            avg_score = sum(scores.values()) / len(scores) if scores else 0
            post_scores.append((i, avg_score, post))

        # Sort by score and take top N
        post_scores.sort(key=lambda x: x[1], reverse=True)
        representative_posts = [p[2] for p in post_scores[:max_clusters]]

        return representative_posts

    def analyze_hw_model_group(self, posts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze a group of posts for the same HW and model"""
        if not posts:
            return {}

        # Combine all text from both title and content
        all_text_parts = []
        for p in posts:
            # Add title
            if p.get('title'):
                all_text_parts.append(p.get('title'))
            # Add content (strip HTML if present)
            if p.get('content'):
                clean_content = self.strip_html(p.get('content'))
                all_text_parts.append(clean_content)

        all_text = ' '.join(all_text_parts)

        # Compute TF-IDF for the group
        tokens = self.tokenize(all_text)
        tf = self.compute_tf(tokens)

        # Get top terms (without IDF for single group)
        top_terms = sorted(tf.items(), key=lambda x: x[1], reverse=True)[:15]

        # Extract strengths and weaknesses from full text
        sw = self.extract_strengths_weaknesses(all_text)

        # Find representative posts
        representative = self.cluster_posts(posts, max_clusters=3)

        return {
            'post_count': len(posts),
            'top_terms': [{'term': t[0], 'score': round(t[1], 4)} for t in top_terms],
            'strengths': sw['strengths'],
            'weaknesses': sw['weaknesses'],
            'representative_posts': [
                {
                    'title': p.get('title', ''),
                    'author': p.get('author', ''),
                    'url': p.get('url', ''),
                    'snippet': p.get('title', '')  # Use title as snippet since content is empty
                }
                for p in representative[:3]
            ]
        }

    def process_data(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Main processing function"""
        print("Running advanced analytics...")

        # Group by homework and model
        hw_model_groups = defaultdict(lambda: defaultdict(list))

        for post in data:
            hw = post.get('homework', 'Unknown')
            model = post.get('model', 'Unknown')
            hw_model_groups[hw][model].append(post)

        # Analyze each group
        analysis = {}
        for hw, models in hw_model_groups.items():
            analysis[hw] = {}
            for model, posts in models.items():
                print(f"Analyzing {hw} - {model} ({len(posts)} posts)...")
                analysis[hw][model] = self.analyze_hw_model_group(posts)

        # Create heatmap data
        all_hws = sorted(hw_model_groups.keys())
        all_models = sorted(set(m for models in hw_model_groups.values() for m in models.keys()))

        heatmap_data = {
            'homeworks': all_hws,
            'models': all_models,
            'matrix': {}
        }

        for hw in all_hws:
            heatmap_data['matrix'][hw] = {}
            for model in all_models:
                count = len(hw_model_groups[hw].get(model, []))
                heatmap_data['matrix'][hw][model] = count

        # Time series analysis
        timeline = defaultdict(lambda: defaultdict(int))
        for post in data:
            date = post.get('created_at', '')[:10] if post.get('created_at') else 'Unknown'
            hw = post.get('homework', 'Unknown')
            timeline[date][hw] += 1

        timeline_data = {
            'dates': sorted(timeline.keys()),
            'series': {}
        }

        for hw in all_hws:
            timeline_data['series'][hw] = [
                timeline[date].get(hw, 0) for date in timeline_data['dates']
            ]

        # Overall statistics
        total_combinations = sum(1 for hw in analysis for model in analysis[hw])

        # Extract global top terms from titles and content
        all_posts_text_parts = []
        for p in data:
            if p.get('title'):
                all_posts_text_parts.append(p.get('title'))
            if p.get('content'):
                clean_content = self.strip_html(p.get('content'))
                all_posts_text_parts.append(clean_content)
        all_posts_text = ' '.join(all_posts_text_parts)
        global_tokens = self.tokenize(all_posts_text)
        global_tf = self.compute_tf(global_tokens)
        global_top_terms = sorted(global_tf.items(), key=lambda x: x[1], reverse=True)[:30]

        return {
            'generated_at': datetime.now().isoformat(),
            'hw_model_analysis': analysis,
            'heatmap': heatmap_data,
            'timeline': timeline_data,
            'statistics': {
                'total_posts': len(data),
                'total_homeworks': len(all_hws),
                'total_models': len(all_models),
                'total_combinations': total_combinations,
                'global_top_terms': [
                    {'term': t[0], 'frequency': round(t[1], 4)}
                    for t in global_top_terms
                ]
            }
        }


def main():
    """Main execution"""
    print("=" * 60)
    print("CS182 Blue Team - Advanced Analytics")
    print("=" * 60)

    # Load data - prefer merged file with full content
    input_path = "data/special_participation_a_merged.json"
    if not os.path.exists(input_path):
        print(f"Warning: {input_path} not found, trying fallback...")
        input_path = "data/special_participation_a.json"
        if not os.path.exists(input_path):
            print(f"Error: No data file found!")
            print("Please run merge_settled_with_content.py first.")
            return

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} posts")

    # Run analytics
    analyzer = AdvancedAnalytics()
    results = analyzer.process_data(data)

    # Save results
    output_path = "data/advanced_analytics.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nAdvanced analytics saved to {output_path}")
    print("=" * 60)
    print("\nSummary:")
    print(f"  - Analyzed {results['statistics']['total_combinations']} HW×Model combinations")
    print(f"  - Extracted top terms, strengths, and weaknesses for each group")
    print(f"  - Generated heatmap and timeline data")
    print("=" * 60)


if __name__ == "__main__":
    main()