
from pyramid.path import AssetResolver
import photozzap.staticresources

def concatenate(file_list, output_file):
    a = AssetResolver('photozzap')
    texts = []
    for file in file_list:
        resolver = a.resolve(file)
        full_path = resolver.abspath()
        print("opening %s" % full_path)
        resource_text = open(full_path, 'r').read()
        texts.append(resource_text)

    # open output file
    resolver = a.resolve(output_file)
    output_path = resolver.abspath()
  
    output_file = open(output_path, "w")
    output_file.write("\n".join(texts))
    output_file.close()    
    
    print("wrote combined code to %s" % output_path)


if __name__ == "__main__":
    concatenate(photozzap.staticresources.javascript_files, photozzap.staticresources.combined_javascript_file)
    concatenate(photozzap.staticresources.css_files, photozzap.staticresources.combined_css_file)
