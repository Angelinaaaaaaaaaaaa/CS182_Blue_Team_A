"""
CS182 Blue Team - Advanced Analytics Processor
Generates insights, trends, and summaries using AI
"""

import os
import json
from collections import Counter, defaultdict
from typing import List, Dict, Any
import openai
from dotenv import load_dotenv

load_dotenv()

class AnalyticsProcessor:
    def __init__(self):
        openai.api_key = os.getenv('OPENAI_API_KEY')
        if not openai.api_key:
            print("Warning: OPENAI_API_KEY not found. AI features will be limited.")

    def load_data(self, json_path: str) -> List[Dict[str, Any]]:
        """Load processed data from JSON"""
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def calculate_statistics(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate comprehensive statistics from the data"""
        stats = {
            "total_posts": len(data),
            "total_authors": len(set(item['author'] for item in data)),
            "models": {},
            "homeworks": {},
            "timeline": defaultdict(int),
            "top_contributors": [],
            "model_homework_matrix": defaultdict(lambda: defaultdict(int))
        }

        # Count models
        model_counter = Counter(item['model'] for item in data)
        stats["models"] = dict(model_counter.most_common())

        # Count homeworks
        hw_counter = Counter(item['homework'] for item in data)
        stats["homeworks"] = dict(hw_counter.most_common())

        # Timeline analysis
        for item in data:
            if item['created_at']:
                date = item['created_at'][:10]  # Extract date part
                stats["timeline"][date] += 1

        # Top contributors
        author_counter = Counter(item['author'] for item in data)
        stats["top_contributors"] = [
            {"author": author, "posts": count}
            for author, count in author_counter.most_common(10)
        ]

        # Model-Homework matrix
        for item in data:
            stats["model_homework_matrix"][item['model']][item['homework']] += 1

        # Convert defaultdict to dict for JSON serialization
        stats["model_homework_matrix"] = {
            model: dict(hw_dict)
            for model, hw_dict in stats["model_homework_matrix"].items()
        }

        stats["timeline"] = dict(sorted(stats["timeline"].items()))

        return stats

    def generate_summaries(self, data: List[Dict[str, Any]], sample_size: int = 10) -> List[Dict[str, Any]]:
        """Generate AI summaries for sample posts"""
        if not openai.api_key:
            print("Skipping AI summaries - no API key")
            return data

        print(f"Generating AI summaries for up to {sample_size} posts...")

        # Sample posts for summarization
        sample = data[:sample_size]

        for i, item in enumerate(sample):
            if item.get('content'):
                try:
                    print(f"Summarizing post {i+1}/{len(sample)}...")

                    response = openai.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant that creates concise, informative summaries of student posts about LLM performance on homework assignments."},
                            {"role": "user", "content": f"Summarize this post in 1-2 sentences, focusing on key findings and observations:\n\n{item['content'][:2000]}"}
                        ],
                        max_tokens=150,
                        temperature=0.7
                    )

                    item['ai_summary'] = response.choices[0].message.content.strip()

                except Exception as e:
                    print(f"Error generating summary for post {i+1}: {e}")
                    item['ai_summary'] = "Summary unavailable"

        return data

    def generate_model_insights(self, advanced_analytics: Dict[str, Any]) -> Dict[str, Any]:
        """Generate deterministic model-focused insights from advanced analytics"""
        model_insights = {}

        # Extract HW-Model analysis
        hw_model_analysis = advanced_analytics.get('hw_model_analysis', {})

        # Collect strengths and weaknesses per model across all homeworks
        model_strengths = defaultdict(list)
        model_weaknesses = defaultdict(list)
        model_top_terms = defaultdict(list)
        model_hw_coverage = defaultdict(list)

        for hw, models in hw_model_analysis.items():
            for model, analysis in models.items():
                if model == 'Unknown':
                    continue

                # Collect strengths
                strengths = analysis.get('strengths', [])
                model_strengths[model].extend(strengths)

                # Collect weaknesses
                weaknesses = analysis.get('weaknesses', [])
                model_weaknesses[model].extend(weaknesses)

                # Collect top terms
                top_terms = analysis.get('top_terms', [])[:5]  # Top 5 per HW
                model_top_terms[model].extend([t['term'] for t in top_terms])

                # Track which HWs this model was tested on
                model_hw_coverage[model].append(hw)

        # Generate insights per model
        for model in model_strengths.keys():
            insights = {
                'homeworks_tested': sorted(model_hw_coverage[model]),
                'total_homeworks': len(model_hw_coverage[model]),
                'strengths': model_strengths[model][:5],  # Top 5 strengths
                'weaknesses': model_weaknesses[model][:5],  # Top 5 weaknesses
                'distinctive_terms': list(set(model_top_terms[model]))[:10]  # Top 10 unique terms
            }

            # Generate summary
            summary_parts = []
            if insights['total_homeworks'] > 0:
                summary_parts.append(f"Tested on {insights['total_homeworks']} homework(s)")

            if insights['strengths']:
                summary_parts.append(f"Strengths noted in {len(insights['strengths'])} instances")

            if insights['weaknesses']:
                summary_parts.append(f"Weaknesses noted in {len(insights['weaknesses'])} instances")

            insights['summary'] = '; '.join(summary_parts) if summary_parts else "Limited data"

            model_insights[model] = insights

        return model_insights

    def generate_insights(self, stats: Dict[str, Any], advanced_analytics: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate deterministic insights focusing on model pros/cons"""
        insights = {
            "key_findings": [],
            "model_comparison": {},
            "coverage_summary": ""
        }

        # Basic insights without AI
        insights["key_findings"].append(
            f"Total of {stats['total_posts']} posts from {stats['total_authors']} unique contributors"
        )

        # Most popular model
        if stats['models']:
            # Filter out Unknown
            valid_models = {k: v for k, v in stats['models'].items() if k != 'Unknown'}
            if valid_models:
                top_model = max(valid_models.items(), key=lambda x: x[1])
                insights["key_findings"].append(
                    f"Most tested model: {top_model[0]} ({top_model[1]} posts)"
                )

                # Add top 3 models
                top_3_models = sorted(valid_models.items(), key=lambda x: x[1], reverse=True)[:3]
                model_names = ', '.join([f"{m[0]} ({m[1]})" for m in top_3_models])
                insights["key_findings"].append(
                    f"Top 3 models by testing frequency: {model_names}"
                )

        # Most covered homework
        if stats['homeworks']:
            valid_hws = {k: v for k, v in stats['homeworks'].items() if k != 'Unknown'}
            if valid_hws:
                top_hw = max(valid_hws.items(), key=lambda x: x[1])
                insights["key_findings"].append(
                    f"Most covered assignment: {top_hw[0]} ({top_hw[1]} posts)"
                )

                # Add diversity metric
                total_models_count = len(valid_models) if stats['models'] else 0
                total_hw_count = len(valid_hws)
                if advanced_analytics:
                    total_combinations = advanced_analytics.get('statistics', {}).get('total_combinations', 0)
                    coverage_pct = round((total_combinations / (total_models_count * total_hw_count) * 100), 1) if total_models_count * total_hw_count > 0 else 0
                    insights["key_findings"].append(
                        f"Coverage diversity: {total_combinations} unique HW×Model combinations ({coverage_pct}% of possible combinations)"
                    )

        # Generate model-focused insights from advanced analytics
        if advanced_analytics:
            print("Generating model comparison insights...")
            model_insights = self.generate_model_insights(advanced_analytics)
            insights["model_comparison"] = model_insights

            # Create coverage summary
            total_models = len([m for m in stats['models'].keys() if m != 'Unknown'])
            total_hws = len([h for h in stats['homeworks'].keys() if h != 'Unknown'])
            insights["coverage_summary"] = f"{total_models} models tested across {total_hws} homework assignments"
        else:
            print("Note: Advanced analytics not available for model comparison")

        return insights

    def process(self, input_path: str, output_path: str = "data/analytics.json", advanced_analytics_path: str = "data/advanced_analytics.json"):
        """Main processing function"""
        print("=" * 60)
        print("CS182 Blue Team - Analytics Processor")
        print("=" * 60)

        # Load data
        data = self.load_data(input_path)
        print(f"Loaded {len(data)} posts")

        # Calculate statistics
        print("\nCalculating statistics...")
        stats = self.calculate_statistics(data)

        # Load advanced analytics if available
        advanced_analytics = None
        if os.path.exists(advanced_analytics_path):
            print(f"\nLoading advanced analytics from {advanced_analytics_path}...")
            try:
                with open(advanced_analytics_path, 'r', encoding='utf-8') as f:
                    advanced_analytics = json.load(f)
                print("Advanced analytics loaded successfully")
            except Exception as e:
                print(f"Warning: Could not load advanced analytics: {e}")

        # Generate summaries (optional)
        # data = self.generate_summaries(data, sample_size=5)

        # Generate insights
        print("\nGenerating insights...")
        insights = self.generate_insights(stats, advanced_analytics)

        # Combine results
        analytics = {
            "generated_at": __import__('datetime').datetime.now().isoformat(),
            "statistics": stats,
            "insights": insights
        }

        # Save analytics
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(analytics, f, indent=2, ensure_ascii=False)

        print(f"\nAnalytics saved to {output_path}")
        print("=" * 60)

        return analytics

def main():
    processor = AnalyticsProcessor()
    # Use merged file with full content if available
    input_path = "data/special_participation_a_merged.json"
    if not os.path.exists(input_path):
        print(f"Warning: {input_path} not found, using fallback...")
        input_path = "data/special_participation_a.json"

    processor.process(
        input_path=input_path,
        output_path="data/analytics.json",
        advanced_analytics_path="data/advanced_analytics.json"
    )

if __name__ == "__main__":
    main()
